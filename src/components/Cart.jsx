import "../styles/Cart.css";

import { FaTimes } from "react-icons/fa";

import { useCart } from "../context/CartContext";

import { guardarPresupuesto } from "../services/api";

import { useNavigate } from "react-router-dom";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");





function resolverImagenCarrito(imagen) {
    if (!imagen) return "/images/logo.png";

    const valor = String(imagen).trim();

    try {
        if (
            valor.startsWith("http://") ||
            valor.startsWith("https://")
        ) {
            const url = new URL(valor);
            if (url.pathname.startsWith("/images/")) {
                return url.pathname;
            }
            return valor;
        }
    } catch {
        // Continúa con las reglas siguientes.
    }

    if (valor.startsWith("/images/")) {
        return valor;
    }

    if (valor.startsWith("/uploads/")) {
        return `${API}${valor}`;
    }

    if (valor.startsWith("/")) {
        return valor;
    }

    return `/images/productos/${valor}`;
}

export default function Cart({
    abierto,
    cerrar
}) {

    const navigate = useNavigate();

    const {
        carrito,
        eliminarDelCarrito,
        vaciarCarrito,
        mostrarNotificacion
    } = useCart();


    // ==========================================
    // CALCULAR TOTAL
    // ==========================================

    const total = carrito.reduce(

        (acum, item) =>

            acum +
            Number(item.precio || 0) *
            Number(item.cantidad || 0),

        0

    );


    // ==========================================
    // SOLICITAR PRESUPUESTO
    // ==========================================

    async function solicitarPresupuesto() {


        // --------------------------------------
        // COMPROBAR CARRITO
        // --------------------------------------

        if (carrito.length === 0) {

            mostrarNotificacion(
                "No hay productos en el carrito.",
                "aviso"
            );

            return;

        }


        // --------------------------------------
        // COMPROBAR SESIÓN SEGURA DEL CLIENTE
        // --------------------------------------

        const clienteToken =
            localStorage.getItem(
                "cliente_token"
            );


        if (!clienteToken) {

            localStorage.removeItem(
                "cliente"
            );


            mostrarNotificacion(
                "Para solicitar un presupuesto tenés que iniciar sesión.",
                "aviso",
                4000
            );


            cerrar();

            navigate(
                "/login"
            );


            return;

        }


        // --------------------------------------
        // GENERAR TICKET
        // --------------------------------------

        const codigo =
            `RC-${Date.now()}`;


        // --------------------------------------
        // PREPARAR DATOS
        // --------------------------------------

        const datosPresupuesto = {

            // La identidad del cliente NO se envía.
            // El backend la obtiene del JWT.

            codigo,

            productos:
                carrito,

            total

        };


        // --------------------------------------
        // GUARDAR EN MYSQL
        // --------------------------------------

        try {

            const respuesta =
                await guardarPresupuesto(
                    datosPresupuesto
                );


            console.log(
                "✅ Presupuesto guardado:",
                respuesta
            );


            // ----------------------------------
            // LIMPIAR CARRITO
            // ----------------------------------

            // ----------------------------------
            // GUARDAR CONFIRMACIÓN PARA MI CUENTA
            // ----------------------------------

            const confirmacionTicket = {
                codigo:
                    respuesta.codigo || codigo,

                total,

                fecha:
                    new Date().toISOString()
            };

            localStorage.setItem(
                "ticket_recien_generado",
                JSON.stringify(
                    confirmacionTicket
                )
            );


            // ----------------------------------
            // LIMPIAR Y CERRAR CARRITO
            // ----------------------------------

            vaciarCarrito();

            cerrar();


            // ----------------------------------
            // IR A MI CUENTA
            // LA CONFIRMACIÓN SE MUESTRA ALLÍ
            // ----------------------------------

            navigate(
                "/mi-cuenta",
                {
                    state: {
                        ticketGenerado:
                            confirmacionTicket
                    }
                }
            );


        } catch (error) {

            console.error(
                "❌ Error guardando presupuesto:",
                error
            );

            mostrarNotificacion(
                error.message ||
                "No se pudo generar el ticket.",
                "error",
                5000
            );

        }

    }


    return (

        <>

            {/* FONDO */}

            {abierto && (

                <div
                    className="cartOverlay"
                    onClick={cerrar}
                />

            )}


            {/* CARRITO */}

            <aside
                className={
                    `cart ${
                        abierto
                            ? "open"
                            : ""
                    }`
                }
            >

                {/* CABECERA */}

                <div className="cartHeader">

                    <h2>
                        Mi Carrito
                    </h2>

                    <button
                        className="closeCart"
                        onClick={cerrar}
                        type="button"
                        aria-label="Cerrar carrito"
                    >
                        <FaTimes />
                    </button>

                </div>


                {/* PRODUCTOS */}

                {carrito.length === 0 ? (

                    <p className="empty">
                        No hay productos agregados.
                    </p>

                ) : (

                    carrito.map(
                        (item) => (

                            <div
                                className="cartItem"
                                key={item.id}
                            >

                                <img
                                    src={resolverImagenCarrito(item.imagen)}
                                    alt={item.nombre}
                                />

                                <div className="cartInfo">

                                    <h4>
                                        {item.nombre}
                                    </h4>

                                    <p>
                                        Cantidad: {item.cantidad}
                                    </p>

                                    <strong>

                                        $

                                        {Number(
                                            item.precio || 0
                                        ).toLocaleString(
                                            "es-AR"
                                        )}

                                    </strong>

                                </div>

                                <button
                                    className="deleteItem"
                                    onClick={() =>
                                        eliminarDelCarrito(
                                            item.id
                                        )
                                    }
                                    type="button"
                                    aria-label={
                                        `Eliminar ${item.nombre}`
                                    }
                                >
                                    ✕
                                </button>

                            </div>

                        )
                    )

                )}


                {/* PIE */}

                {carrito.length > 0 && (

                    <div className="cartFooter">

                        <h3>
                            Total
                        </h3>

                        <h2>

                            $

                            {total.toLocaleString(
                                "es-AR"
                            )}

                        </h2>

                        <p
                            style={{
                                marginBottom: "15px",
                                fontSize: "14px",
                                color: "#666",
                                lineHeight: "1.5"
                            }}
                        >
                            Al solicitar el presupuesto
                            se generará un número de ticket.
                            Un asesor se comunicará con vos
                            para continuar con la atención.
                        </p>

                        <button
                            className="sendOrder"
                            onClick={
                                solicitarPresupuesto
                            }
                            type="button"
                        >
                            Generar ticket
                        </button>

                        <button
                            className="clearCart"
                            onClick={
                                vaciarCarrito
                            }
                            type="button"
                        >
                            Vaciar Carrito
                        </button>

                    </div>

                )}

            </aside>

        </>

    );

}