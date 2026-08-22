import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "../styles/AdminClienteDetalle.css";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const ESTADOS = [
    "Pendiente",
    "Contactado",
    "En revisión",
    "Aprobado",
    "Rechazado"
];

export default function AdminClienteDetalle() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [cliente, setCliente] = useState(null);
    const [presupuestos, setPresupuestos] = useState([]);

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const [actualizandoEstado, setActualizandoEstado] =
        useState(null);


    // ==========================================
    // CARGAR CLIENTE
    // ==========================================

    async function cargarCliente() {

        try {

            setCargando(true);
            setError("");

            const response = await fetch(
                `${API}/admin/clientes/${id}`
            );

            const datos =
                await response.json();

            if (!response.ok || !datos.ok) {

                throw new Error(
                    datos.mensaje ||
                    "No se pudo cargar el cliente."
                );

            }

            setCliente(
                datos.cliente
            );

            setPresupuestos(
                datos.presupuestos || []
            );

        } catch (err) {

            console.error(
                "Error cargando cliente:",
                err
            );

            setError(
                err.message ||
                "No se pudo cargar la información del cliente."
            );

        } finally {

            setCargando(false);

        }

    }


    // ==========================================
    // CARGAR AL INICIAR
    // ==========================================

    useEffect(() => {

        cargarCliente();

    }, [id]);


    // ==========================================
    // CAMBIAR ESTADO
    // ==========================================

    async function cambiarEstado(
        presupuestoId,
        nuevoEstado
    ) {

        try {

            setActualizandoEstado(
                presupuestoId
            );

            const response = await fetch(
                `${API}/presupuestos/${presupuestoId}/estado`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        estado:
                            nuevoEstado
                    })
                }
            );

            const datos =
                await response.json();

            if (!response.ok || !datos.ok) {

                throw new Error(
                    datos.mensaje ||
                    "No se pudo actualizar el estado."
                );

            }

            setPresupuestos(
                anteriores =>
                    anteriores.map(
                        presupuesto =>
                            presupuesto.id ===
                            presupuestoId
                                ? {
                                    ...presupuesto,
                                    estado:
                                        nuevoEstado
                                }
                                : presupuesto
                    )
            );

        } catch (err) {

            console.error(
                "Error cambiando estado:",
                err
            );

            alert(
                err.message ||
                "No se pudo actualizar el estado."
            );

        } finally {

            setActualizandoEstado(null);

        }

    }


    // ==========================================
    // CONVERTIR PRODUCTOS
    // ==========================================

    function obtenerProductos(productos) {

        if (!productos) {

            return [];

        }

        if (Array.isArray(productos)) {

            return productos;

        }

        try {

            const lista =
                JSON.parse(productos);

            return Array.isArray(lista)
                ? lista
                : [];

        } catch {

            return [];

        }

    }


    // ==========================================
    // FORMATEAR FECHA
    // ==========================================

    function formatearFecha(fecha) {

        if (!fecha) {

            return "-";

        }

        const fechaObj =
            new Date(fecha);

        if (
            Number.isNaN(
                fechaObj.getTime()
            )
        ) {

            return "-";

        }

        return fechaObj.toLocaleString(
            "es-AR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }


    // ==========================================
    // CLASE DE ESTADO
    // ==========================================

    function claseEstado(estado) {

        return String(
            estado || "Pendiente"
        )
            .toLowerCase()
            .replace(/\s+/g, "-");

    }


    // ==========================================
    // CARGANDO
    // ==========================================

    if (cargando) {

        return (

            <section className="adminClienteDetalle">

                <p>
                    Cargando información...
                </p>

            </section>

        );

    }


    // ==========================================
    // ERROR
    // ==========================================

    if (
        error ||
        !cliente
    ) {

        return (

            <section className="adminClienteDetalle">

                <button
                    className="volverClientes"
                    onClick={() =>
                        navigate(
                            "/admin/clientes"
                        )
                    }
                    type="button"
                >
                    ← Volver a clientes
                </button>

                <div className="detalleError">

                    {error ||
                        "Cliente no encontrado."}

                </div>

            </section>

        );

    }


    // ==========================================
    // ESTADÍSTICAS DEL CLIENTE
    // ==========================================

    const totalSolicitado =
        presupuestos.reduce(
            (total, presupuesto) =>
                total +
                Number(
                    presupuesto.total || 0
                ),
            0
        );

    const pendientes =
        presupuestos.filter(
            presupuesto =>
                (
                    presupuesto.estado ||
                    "Pendiente"
                ) === "Pendiente"
        ).length;

    const contactados =
        presupuestos.filter(
            presupuesto =>
                presupuesto.estado ===
                "Contactado"
        ).length;

    const revision =
        presupuestos.filter(
            presupuesto =>
                presupuesto.estado ===
                "En revisión"
        ).length;

    const aprobados =
        presupuestos.filter(
            presupuesto =>
                presupuesto.estado ===
                "Aprobado"
        ).length;

    const rechazados =
        presupuestos.filter(
            presupuesto =>
                presupuesto.estado ===
                "Rechazado"
        ).length;


    return (

        <section className="adminClienteDetalle">


            {/* ==========================================
                VOLVER
            ========================================== */}

            <button
                className="volverClientes"
                onClick={() =>
                    navigate(
                        "/admin/clientes"
                    )
                }
                type="button"
            >
                ← Volver a clientes
            </button>


            {/* ==========================================
                CABECERA
            ========================================== */}

            <div className="clienteDetalleHeader">

                <div>

                    <span className="clienteId">

                        Cliente #{cliente.id}

                    </span>

                    <h1>

                        {cliente.nombre}

                    </h1>

                    <p>
                        Información e historial
                        de solicitudes del cliente.
                    </p>

                </div>

                <div>

                    {Number(
                        cliente.verificado
                    ) === 1 ? (

                        <span className="estadoVerificado">

                            ✓ Verificado

                        </span>

                    ) : (

                        <span className="estadoPendiente">

                            Pendiente de verificación

                        </span>

                    )}

                </div>

            </div>


            {/* ==========================================
                DATOS DEL CLIENTE
            ========================================== */}

            <div className="datosCliente">

                <div className="datoCliente">

                    <span>
                        Nombre
                    </span>

                    <strong>
                        {cliente.nombre || "-"}
                    </strong>

                </div>

                <div className="datoCliente">

                    <span>
                        Email
                    </span>

                    <strong>
                        {cliente.email || "-"}
                    </strong>

                </div>

                <div className="datoCliente">

                    <span>
                        Teléfono
                    </span>

                    <strong>
                        {cliente.telefono || "-"}
                    </strong>

                </div>

            </div>


            {/* ==========================================
                RESUMEN GENERAL
            ========================================== */}

            <div className="resumenCliente">

                <div>

                    <span>
                        Tickets
                    </span>

                    <strong>
                        {presupuestos.length}
                    </strong>

                </div>

                <div>

                    <span>
                        Pendientes
                    </span>

                    <strong>
                        {pendientes}
                    </strong>

                </div>

                <div>

                    <span>
                        Contactados
                    </span>

                    <strong>
                        {contactados}
                    </strong>

                </div>

                <div>

                    <span>
                        En revisión
                    </span>

                    <strong>
                        {revision}
                    </strong>

                </div>

                <div>

                    <span>
                        Aprobados
                    </span>

                    <strong>
                        {aprobados}
                    </strong>

                </div>

                <div>

                    <span>
                        Rechazados
                    </span>

                    <strong>
                        {rechazados}
                    </strong>

                </div>

                <div>

                    <span>
                        Total solicitado
                    </span>

                    <strong>

                        $

                        {totalSolicitado.toLocaleString(
                            "es-AR"
                        )}

                    </strong>

                </div>

            </div>


            {/* ==========================================
                HISTORIAL DE TICKETS
            ========================================== */}

            <div className="historialCliente">

                <div className="historialClienteHeader">

                    <div>

                        <h2>
                            Historial de tickets
                        </h2>

                        <p>
                            Todas las solicitudes
                            realizadas por este cliente.
                        </p>

                    </div>

                </div>


                {presupuestos.length === 0 ? (

                    <div className="sinHistorial">

                        <h3>
                            Sin tickets
                        </h3>

                        <p>
                            Este cliente todavía
                            no realizó solicitudes.
                        </p>

                    </div>

                ) : (

                    <div className="historialLista">

                        {presupuestos.map(
                            presupuesto => {

                                const productos =
                                    obtenerProductos(
                                        presupuesto.productos
                                    );

                                const estado =
                                    presupuesto.estado ||
                                    "Pendiente";

                                return (

                                    <article
                                        className="historialCard"
                                        key={
                                            presupuesto.id
                                        }
                                    >


                                        {/* ENCABEZADO DEL TICKET */}

                                        <div className="historialHeader">

                                            <div>

                                                <span className="codigoPresupuesto">

                                                    {
                                                        presupuesto.codigo
                                                    }

                                                </span>

                                                <small>

                                                    Ticket #
                                                    {
                                                        presupuesto.id
                                                    }

                                                </small>

                                            </div>

                                            <span
                                                className={
                                                    `estadoClienteTicket ${claseEstado(
                                                        estado
                                                    )}`
                                                }
                                            >
                                                {estado}
                                            </span>

                                        </div>


                                        {/* FECHA */}

                                        <div className="fechaTicketCliente">

                                            <span>
                                                Fecha
                                            </span>

                                            <strong>

                                                {formatearFecha(
                                                    presupuesto.fecha
                                                )}

                                            </strong>

                                        </div>


                                        {/* PRODUCTOS */}

                                        <div className="productosHistorial">

                                            {productos.length === 0 ? (

                                                <p>
                                                    Sin productos registrados.
                                                </p>

                                            ) : (

                                                productos.map(
                                                    (
                                                        producto,
                                                        index
                                                    ) => (

                                                        <div
                                                            className="productoHistorial"
                                                            key={
                                                                producto.id ||
                                                                index
                                                            }
                                                        >

                                                            <span>

                                                                {
                                                                    producto.nombre ||
                                                                    "Producto"
                                                                }

                                                            </span>

                                                            <strong>

                                                                x
                                                                {
                                                                    Number(
                                                                        producto.cantidad ||
                                                                        0
                                                                    )
                                                                }

                                                            </strong>

                                                        </div>

                                                    )
                                                )

                                            )}

                                        </div>


                                        {/* TOTAL */}

                                        <div className="historialTotal">

                                            <span>
                                                Total
                                            </span>

                                            <strong>

                                                $

                                                {Number(
                                                    presupuesto.total ||
                                                    0
                                                ).toLocaleString(
                                                    "es-AR"
                                                )}

                                            </strong>

                                        </div>


                                        {/* CAMBIAR ESTADO */}

                                        <div className="estadoClienteBox">

                                            <span>
                                                Estado del ticket
                                            </span>

                                            <select
                                                className="estadoPresupuestoSelect"
                                                value={estado}
                                                disabled={
                                                    actualizandoEstado ===
                                                    presupuesto.id
                                                }
                                                onChange={(e) =>
                                                    cambiarEstado(
                                                        presupuesto.id,
                                                        e.target.value
                                                    )
                                                }
                                            >

                                                {ESTADOS.map(
                                                    estadoDisponible => (

                                                        <option
                                                            key={
                                                                estadoDisponible
                                                            }
                                                            value={
                                                                estadoDisponible
                                                            }
                                                        >
                                                            {
                                                                estadoDisponible
                                                            }
                                                        </option>

                                                    )
                                                )}

                                            </select>

                                        </div>


                                        {/* ACCIONES */}

                                        <div className="accionesClienteTicket">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(
                                                        `/admin/presupuestos/${presupuesto.id}`
                                                    )
                                                }
                                            >
                                                Ver ticket completo
                                            </button>

                                        </div>

                                    </article>

                                );

                            }
                        )}

                    </div>

                )}

            </div>

        </section>

    );

}