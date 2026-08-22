import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState
} from "react";

import "../styles/Cart.css";

const CartContext = createContext();

export function CartProvider({ children }) {

    const [carrito, setCarrito] = useState(() => {

        const carritoGuardado =
            localStorage.getItem("carrito");

        if (!carritoGuardado) {
            return [];
        }

        try {

            return JSON.parse(
                carritoGuardado
            );

        } catch (error) {

            console.error(
                "Error leyendo el carrito:",
                error
            );

            return [];

        }

    });


    // ==========================================
    // NOTIFICACIONES
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
    // GUARDAR CARRITO
    // ==========================================

    useEffect(() => {

        localStorage.setItem(
            "carrito",
            JSON.stringify(carrito)
        );

    }, [carrito]);


    // ==========================================
    // AGREGAR AL CARRITO
    // ==========================================

    function agregarAlCarrito(producto) {

        setCarrito((carritoActual) => {

            const existente =
                carritoActual.find(
                    (item) =>
                        item.id === producto.id
                );


            if (existente) {

                return carritoActual.map(
                    (item) => {

                        if (
                            item.id === producto.id
                        ) {

                            return {
                                ...item,
                                cantidad:
                                    item.cantidad + 1
                            };

                        }

                        return item;

                    }
                );

            }


            return [
                ...carritoActual,
                {
                    ...producto,
                    cantidad: 1
                }
            ];

        });


        mostrarNotificacion(
            `${producto.nombre || "Producto"} agregado al carrito.`,
            "exito",
            3000
        );

    }


    // ==========================================
    // ELIMINAR DEL CARRITO
    // ==========================================

    function eliminarDelCarrito(id) {

        setCarrito((carritoActual) => {

            return carritoActual.filter(
                (item) =>
                    item.id !== id
            );

        });

    }


    // ==========================================
    // VACIAR CARRITO
    // ==========================================

    function vaciarCarrito() {

        setCarrito([]);

    }


    // ==========================================
    // CAMBIAR CANTIDAD
    // ==========================================

    function cambiarCantidad(
        id,
        cantidad
    ) {

        if (cantidad <= 0) {

            eliminarDelCarrito(id);

            return;

        }


        setCarrito((carritoActual) => {

            return carritoActual.map(
                (item) => {

                    if (
                        item.id === id
                    ) {

                        return {
                            ...item,
                            cantidad
                        };

                    }

                    return item;

                }
            );

        });

    }


    return (

        <CartContext.Provider
            value={{
                carrito,
                agregarAlCarrito,
                eliminarDelCarrito,
                vaciarCarrito,
                cambiarCantidad,
                mostrarNotificacion
            }}
        >

            {children}


            {/* NOTIFICACIÓN GLOBAL */}

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


// ==========================================
// HOOK DEL CARRITO
// ==========================================

export function useCart() {

    return useContext(
        CartContext
    );

}