import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState
} from "react";

import { useNavigate } from "react-router-dom";

import "../styles/Cart.css";

const CartContext = createContext();

const PRODUCTO_PENDIENTE_KEY =
    "rc_producto_pendiente";

const VOLVER_LOGIN_KEY =
    "rc_volver_despues_login";

export function CartProvider({ children }) {

    const navigate = useNavigate();

    const [carrito, setCarrito] =
        useState([]);


    // ==========================================
    // NOTIFICACIONES GLOBALES
    // ==========================================

    const [notificacion, setNotificacion] =
        useState(null);

    const temporizadorNotificacion =
        useRef(null);


    function mostrarNotificacion(
        mensaje,
        tipo = "exito",
        duracion = 3000
    ) {

        if (
            temporizadorNotificacion.current
        ) {

            clearTimeout(
                temporizadorNotificacion.current
            );

        }

        setNotificacion({
            mensaje,
            tipo
        });

        temporizadorNotificacion.current =
            setTimeout(() => {
                setNotificacion(null);
            }, duracion);

    }


    function cerrarNotificacion() {

        if (
            temporizadorNotificacion.current
        ) {

            clearTimeout(
                temporizadorNotificacion.current
            );

        }

        setNotificacion(null);

    }


    useEffect(() => {

        return () => {

            if (
                temporizadorNotificacion.current
            ) {

                clearTimeout(
                    temporizadorNotificacion.current
                );

            }

        };

    }, []);


    // ==========================================
    // SESIÓN DE CLIENTE
    // ==========================================

    function clienteEstaLogueado() {

        return Boolean(
            localStorage.getItem(
                "cliente_token"
            )
        );

    }


    function guardarProductoPendiente(
        producto
    ) {

        try {

            sessionStorage.setItem(
                PRODUCTO_PENDIENTE_KEY,
                JSON.stringify(producto)
            );

            const destino =
                `${window.location.pathname}${window.location.search}${window.location.hash}`;

            sessionStorage.setItem(
                VOLVER_LOGIN_KEY,
                destino || "/"
            );

        } catch (error) {

            console.error(
                "No se pudo guardar el producto pendiente:",
                error
            );

        }

    }


    // ==========================================
    // AGREGAR AL CARRITO
    // ==========================================

    function agregarAlCarrito(producto) {

        if (!clienteEstaLogueado()) {

            guardarProductoPendiente(
                producto
            );

            navigate(
                "/login",
                {
                    state: {
                        motivo:
                            "carrito"
                    }
                }
            );

            return false;

        }


        setCarrito(
            (carritoActual) => {

                const existe =
                    carritoActual.find(
                        (item) =>
                            item.id === producto.id
                    );


                if (existe) {

                    return carritoActual.map(
                        (item) =>
                            item.id === producto.id
                                ? {
                                    ...item,
                                    cantidad:
                                        Number(
                                            item.cantidad || 0
                                        ) + 1
                                }
                                : item
                    );

                }


                return [
                    ...carritoActual,
                    {
                        ...producto,
                        cantidad: 1
                    }
                ];

            }
        );


        mostrarNotificacion(
            `${producto.nombre || "Producto"} agregado al carrito.`,
            "exito",
            3000
        );


        return true;

    }


    // ==========================================
    // ELIMINAR DEL CARRITO
    // ==========================================

    function eliminarDelCarrito(id) {

        setCarrito(
            (carritoActual) =>
                carritoActual.filter(
                    (item) =>
                        item.id !== id
                )
        );

    }


    // ==========================================
    // VACIAR CARRITO
    // ==========================================

    function vaciarCarrito() {

        setCarrito([]);

    }


    return (

        <CartContext.Provider
            value={{
                carrito,
                agregarAlCarrito,
                eliminarDelCarrito,
                vaciarCarrito,
                mostrarNotificacion,
                clienteEstaLogueado
            }}
        >

            {children}


            {notificacion && (

                <div
                    className={
                        `rcToast rcToast-${notificacion.tipo}`
                    }
                    role="status"
                >

                    <div className="rcToastIcon">
                        {notificacion.tipo === "exito" && "✓"}
                        {notificacion.tipo === "error" && "!"}
                        {notificacion.tipo === "aviso" && "i"}
                    </div>

                    <div className="rcToastContenido">

                        <strong>
                            {notificacion.tipo === "exito"
                                ? "Listo"
                                : notificacion.tipo === "error"
                                    ? "Ocurrió un problema"
                                    : "Atención"
                            }
                        </strong>

                        <span>
                            {notificacion.mensaje}
                        </span>

                    </div>

                    <button
                        type="button"
                        className="rcToastCerrar"
                        onClick={
                            cerrarNotificacion
                        }
                        aria-label="Cerrar notificación"
                    >
                        ×
                    </button>

                </div>

            )}

        </CartContext.Provider>

    );

}

export function useCart() {

    return useContext(
        CartContext
    );

}
