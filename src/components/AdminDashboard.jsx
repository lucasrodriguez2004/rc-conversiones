import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/AdminDashboard.css";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export default function AdminDashboard() {

    const navigate = useNavigate();

    const [datos, setDatos] = useState(null);
    const [ultimos, setUltimos] = useState([]);
    const [seguimientos, setSeguimientos] = useState([]);

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");


    // ==========================================
    // CARGAR DASHBOARD
    // ==========================================

    async function cargarDashboard() {

        try {

            setError("");

            const [
                responseDashboard,
                responsePresupuestos,
                responseSeguimientos
            ] = await Promise.all([
                fetch(
                    `${API}/admin/dashboard`
                ),

                fetch(
                    `${API}/admin/dashboard/ultimos-presupuestos`
                ),

                fetch(
                    `${API}/admin/dashboard/seguimientos`
                )
            ]);


            const [
                resultadoDashboard,
                resultadoPresupuestos,
                resultadoSeguimientos
            ] = await Promise.all([
                responseDashboard.json(),
                responsePresupuestos.json(),
                responseSeguimientos.json()
            ]);


            if (
                !responseDashboard.ok ||
                !resultadoDashboard.ok
            ) {

                throw new Error(
                    resultadoDashboard.mensaje ||
                    "No se pudo cargar el dashboard."
                );

            }


            if (
                !responsePresupuestos.ok ||
                !resultadoPresupuestos.ok
            ) {

                throw new Error(
                    resultadoPresupuestos.mensaje ||
                    "No se pudieron cargar los tickets."
                );

            }


            if (
                !responseSeguimientos.ok ||
                !resultadoSeguimientos.ok
            ) {

                throw new Error(
                    resultadoSeguimientos.mensaje ||
                    "No se pudieron cargar los seguimientos."
                );

            }


            setDatos(
                resultadoDashboard.dashboard
            );

            setUltimos(
                resultadoPresupuestos.presupuestos || []
            );

            setSeguimientos(
                resultadoSeguimientos.seguimientos || []
            );

        } catch (err) {

            console.error(
                "Error cargando dashboard:",
                err
            );

            setError(
                err.message ||
                "No se pudo conectar con el servidor."
            );

        } finally {

            setCargando(false);

        }

    }


    // ==========================================
    // ACTUALIZACIÓN AUTOMÁTICA
    // ==========================================

    useEffect(() => {

        cargarDashboard();

        const intervalo =
            setInterval(() => {

                cargarDashboard();

            }, 10000);

        return () => {

            clearInterval(
                intervalo
            );

        };

    }, []);


    // ==========================================
    // NAVEGACIÓN
    // ==========================================

    function irATickets(
        estado = null
    ) {

        if (!estado) {

            navigate(
                "/admin/presupuestos"
            );

            return;

        }

        navigate(
            `/admin/presupuestos?estado=${encodeURIComponent(
                estado
            )}`
        );

    }


    function irASinContactar() {

        navigate(
            "/admin/presupuestos?contacto=sin"
        );

    }


    function irASeguimientosHoy() {

        navigate(
            "/admin/presupuestos?seguimiento=hoy"
        );

    }


    function irASeguimientosVencidos() {

        navigate(
            "/admin/presupuestos?seguimiento=vencido"
        );

    }


    // ==========================================
    // FECHAS
    // ==========================================

    function formatearFecha(
        fecha
    ) {

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


    function esMismoDia(
        fechaA,
        fechaB
    ) {

        return (
            fechaA.getFullYear() ===
                fechaB.getFullYear() &&
            fechaA.getMonth() ===
                fechaB.getMonth() &&
            fechaA.getDate() ===
                fechaB.getDate()
        );

    }


    function estadoSeguimiento(
        fecha
    ) {

        if (!fecha) {
            return "Programado";
        }

        const fechaSeguimiento =
            new Date(fecha);

        if (
            Number.isNaN(
                fechaSeguimiento.getTime()
            )
        ) {
            return "Programado";
        }

        const ahora =
            new Date();

        if (
            fechaSeguimiento.getTime() <
            ahora.getTime()
        ) {

            return "Vencido";

        }

        if (
            esMismoDia(
                fechaSeguimiento,
                ahora
            )
        ) {

            return "Hoy";

        }

        return "Programado";

    }


    // ==========================================
    // ESTADOS
    // ==========================================

    function obtenerClaseEstado(
        estado
    ) {

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
            <section className="adminDashboard">

                <div className="dashboardLoading">

                    <h2>
                        Cargando panel...
                    </h2>

                    <p>
                        Estamos obteniendo los datos.
                    </p>

                </div>

            </section>
        );

    }


    // ==========================================
    // ERROR
    // ==========================================

    if (error) {

        return (
            <section className="adminDashboard">

                <div className="dashboardError">

                    <h2>
                        Error
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={
                            cargarDashboard
                        }
                    >
                        Intentar nuevamente
                    </button>

                </div>

            </section>
        );

    }


    return (
        <section className="adminDashboard">


            {/* CABECERA */}

            <div className="dashboardHeader">

                <div>

                    <h1>
                        Panel de administración
                    </h1>

                    <p>
                        Resumen general de RC Conversiones.
                    </p>

                </div>

                <button
                    className="dashboardRefresh"
                    onClick={
                        cargarDashboard
                    }
                    type="button"
                >
                    ↻ Actualizar
                </button>

            </div>


            {/* SEGUIMIENTOS VENCIDOS */}

            {Number(
                datos?.seguimientos_vencidos || 0
            ) > 0 && (

                <button
                    className="dashboardSeguimientoVencidoAlert"
                    onClick={
                        irASeguimientosVencidos
                    }
                    type="button"
                >

                    <div className="seguimientoDashboardIcon">
                        ⚠
                    </div>

                    <div className="seguimientoDashboardText">

                        <strong>

                            {datos.seguimientos_vencidos} seguimiento
                            {Number(
                                datos.seguimientos_vencidos
                            ) !== 1
                                ? "s"
                                : ""}{" "}
                            vencido
                            {Number(
                                datos.seguimientos_vencidos
                            ) !== 1
                                ? "s"
                                : ""}

                        </strong>

                        <span>
                            Hay clientes cuyo seguimiento
                            programado ya venció.
                        </span>

                    </div>

                    <span className="seguimientoDashboardArrow">
                        Revisar →
                    </span>

                </button>

            )}


            {/* SEGUIMIENTOS DE HOY */}

            {Number(
                datos?.seguimientos_hoy || 0
            ) > 0 && (

                <button
                    className="dashboardSeguimientoHoyAlert"
                    onClick={
                        irASeguimientosHoy
                    }
                    type="button"
                >

                    <div className="seguimientoDashboardIcon">
                        📅
                    </div>

                    <div className="seguimientoDashboardText">

                        <strong>

                            {datos.seguimientos_hoy} seguimiento
                            {Number(
                                datos.seguimientos_hoy
                            ) !== 1
                                ? "s"
                                : ""}{" "}
                            para hoy

                        </strong>

                        <span>
                            Tenés clientes programados
                            para contactar hoy.
                        </span>

                    </div>

                    <span className="seguimientoDashboardArrow">
                        Ver →
                    </span>

                </button>

            )}


            {/* SIN CONTACTAR */}

            {Number(
                datos?.sin_contactar || 0
            ) > 0 && (

                <button
                    className="dashboardSinContactoAlert"
                    onClick={
                        irASinContactar
                    }
                    type="button"
                >

                    <div className="sinContactoIcon">
                        ⚠
                    </div>

                    <div className="sinContactoText">

                        <strong>

                            {datos.sin_contactar} ticket
                            {Number(
                                datos.sin_contactar
                            ) !== 1
                                ? "s"
                                : ""}{" "}
                            sin contactar

                        </strong>

                        <span>
                            Hay clientes que todavía no
                            tienen ningún contacto registrado.
                        </span>

                    </div>

                    <span className="sinContactoArrow">
                        Revisar →
                    </span>

                </button>

            )}


            {/* ESTADÍSTICAS */}

            <div className="dashboardGrid">

                <button
                    className="dashboardCard"
                    onClick={() =>
                        navigate(
                            "/admin/clientes"
                        )
                    }
                    type="button"
                >

                    <span className="dashboardCardTitle">
                        Clientes
                    </span>

                    <strong>
                        {Number(
                            datos?.clientes || 0
                        )}
                    </strong>

                    <small>
                        Clientes registrados
                    </small>

                </button>


                <button
                    className="dashboardCard"
                    onClick={() =>
                        irATickets()
                    }
                    type="button"
                >

                    <span className="dashboardCardTitle">
                        Tickets
                    </span>

                    <strong>
                        {Number(
                            datos?.presupuestos || 0
                        )}
                    </strong>

                    <small>
                        Solicitudes recibidas
                    </small>

                </button>


                <button
                    className="dashboardCard dashboardCardSeguimientoVencido"
                    onClick={
                        irASeguimientosVencidos
                    }
                    type="button"
                >

                    <span className="dashboardCardTitle">
                        Seguimientos vencidos
                    </span>

                    <strong>
                        {Number(
                            datos?.seguimientos_vencidos || 0
                        )}
                    </strong>

                    <small>
                        Requieren atención
                    </small>

                </button>


                <button
                    className="dashboardCard dashboardCardSeguimientoHoy"
                    onClick={
                        irASeguimientosHoy
                    }
                    type="button"
                >

                    <span className="dashboardCardTitle">
                        Seguimientos hoy
                    </span>

                    <strong>
                        {Number(
                            datos?.seguimientos_hoy || 0
                        )}
                    </strong>

                    <small>
                        Programados para hoy
                    </small>

                </button>


                <button
                    className="dashboardCard dashboardCardSinContactar"
                    onClick={
                        irASinContactar
                    }
                    type="button"
                >

                    <span className="dashboardCardTitle">
                        Sin contactar
                    </span>

                    <strong>
                        {Number(
                            datos?.sin_contactar || 0
                        )}
                    </strong>

                    <small>
                        Requieren atención
                    </small>

                </button>


                <button
                    className="dashboardCard dashboardCardPendiente"
                    onClick={() =>
                        irATickets(
                            "Pendiente"
                        )
                    }
                    type="button"
                >

                    <span className="dashboardCardTitle">
                        Pendientes
                    </span>

                    <strong>
                        {Number(
                            datos?.pendientes || 0
                        )}
                    </strong>

                    <small>
                        Esperando atención
                    </small>

                </button>


                <button
                    className="dashboardCard dashboardCardContactado"
                    onClick={() =>
                        irATickets(
                            "Contactado"
                        )
                    }
                    type="button"
                >

                    <span className="dashboardCardTitle">
                        Contactados
                    </span>

                    <strong>
                        {Number(
                            datos?.contactados || 0
                        )}
                    </strong>

                    <small>
                        Clientes ya contactados
                    </small>

                </button>


                <button
                    className="dashboardCard dashboardCardRevision"
                    onClick={() =>
                        irATickets(
                            "En revisión"
                        )
                    }
                    type="button"
                >

                    <span className="dashboardCardTitle">
                        En revisión
                    </span>

                    <strong>
                        {Number(
                            datos?.revision || 0
                        )}
                    </strong>

                    <small>
                        Solicitudes en análisis
                    </small>

                </button>


                <button
                    className="dashboardCard dashboardCardAprobado"
                    onClick={() =>
                        irATickets(
                            "Aprobado"
                        )
                    }
                    type="button"
                >

                    <span className="dashboardCardTitle">
                        Aprobados
                    </span>

                    <strong>
                        {Number(
                            datos?.aprobados || 0
                        )}
                    </strong>

                    <small>
                        Presupuestos aprobados
                    </small>

                </button>


                <button
                    className="dashboardCard dashboardCardRechazado"
                    onClick={() =>
                        irATickets(
                            "Rechazado"
                        )
                    }
                    type="button"
                >

                    <span className="dashboardCardTitle">
                        Rechazados
                    </span>

                    <strong>
                        {Number(
                            datos?.rechazados || 0
                        )}
                    </strong>

                    <small>
                        Presupuestos rechazados
                    </small>

                </button>

            </div>


            {/* PRÓXIMOS SEGUIMIENTOS */}

            <div className="dashboardProximosSeguimientos">

                <div className="dashboardProximosSeguimientosHeader">

                    <div>

                        <h2>
                            Próximos seguimientos
                        </h2>

                        <p>
                            Clientes que requieren seguimiento
                            próximamente.
                        </p>

                    </div>

                    <button
    type="button"
    onClick={() =>
        navigate(
            "/admin/presupuestos?seguimiento=programado"
        )
    }
>
    Ver programados →
</button>

                </div>


                {seguimientos.length === 0 ? (

                    <div className="dashboardSinSeguimientos">

                        <span>
                            ✅
                        </span>

                        <div>

                            <strong>
                                No hay seguimientos pendientes
                            </strong>

                            <p>
                                No tenés seguimientos programados
                                actualmente.
                            </p>

                        </div>

                    </div>

                ) : (

                    <div className="dashboardSeguimientosLista">

                        {seguimientos.map(
                            item => {

                                const situacion =
                                    estadoSeguimiento(
                                        item.proximo_seguimiento
                                    );

                                return (

                                    <button
                                        key={
                                            item.id
                                        }
                                        className={
                                            `dashboardSeguimientoFila ${
                                                situacion === "Vencido"
                                                    ? "vencido"
                                                    : situacion === "Hoy"
                                                        ? "hoy"
                                                        : "programado"
                                            }`
                                        }
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                `/admin/presupuestos/${item.id}`
                                            )
                                        }
                                    >

                                        <div className="dashboardSeguimientoFilaIcono">

                                            {situacion === "Vencido"
                                                ? "⚠"
                                                : situacion === "Hoy"
                                                    ? "📅"
                                                    : "🕒"
                                            }

                                        </div>


                                        <div className="dashboardSeguimientoFilaPrincipal">

                                            <div className="dashboardSeguimientoFilaTop">

                                                <strong>
                                                    {item.codigo ||
                                                        `Ticket #${item.id}`}
                                                </strong>

                                                <span
                                                    className={
                                                        `dashboardSeguimientoEstado ${
                                                            situacion.toLowerCase()
                                                        }`
                                                    }
                                                >
                                                    {situacion}
                                                </span>

                                            </div>

                                            <span className="dashboardSeguimientoCliente">
                                                {item.cliente ||
                                                    "Cliente sin nombre"}
                                            </span>

                                            <small>
                                                {formatearFecha(
                                                    item.proximo_seguimiento
                                                )}
                                            </small>

                                        </div>


                                        <div className="dashboardSeguimientoFilaMeta">

                                            <span>
                                                Estado
                                            </span>

                                            <strong>
                                                {item.estado ||
                                                    "Pendiente"}
                                            </strong>

                                        </div>


                                        <span className="dashboardSeguimientoAbrir">
                                            →
                                        </span>

                                    </button>

                                );

                            }
                        )}

                    </div>

                )}

            </div>


            {/* MONTO */}

            <div className="dashboardMonto">

                <div>

                    <span>
                        Monto total solicitado
                    </span>

                    <strong>
                        $
                        {Number(
                            datos?.monto || 0
                        ).toLocaleString(
                            "es-AR"
                        )}
                    </strong>

                </div>

                <button
                    type="button"
                    onClick={() =>
                        irATickets()
                    }
                >
                    Ver tickets →
                </button>

            </div>


            {/* ÚLTIMOS TICKETS */}

            <div className="ultimosPresupuestos">

                <div className="ultimosHeader">

                    <div>

                        <h2>
                            Últimos tickets
                        </h2>

                        <p>
                            Las últimas solicitudes recibidas.
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            irATickets()
                        }
                    >
                        Ver todos →
                    </button>

                </div>


                {ultimos.length === 0 ? (

                    <div className="sinPresupuestos">

                        <p>
                            Todavía no hay tickets registrados.
                        </p>

                    </div>

                ) : (

                    <div className="tablaPresupuestos">

                        <div className="tablaHeader">

                            <span>
                                Código
                            </span>

                            <span>
                                Cliente
                            </span>

                            <span>
                                Fecha
                            </span>

                            <span>
                                Total
                            </span>

                            <span>
                                Estado
                            </span>

                        </div>


                        {ultimos.map(
                            presupuesto => (

                                <button
                                    key={
                                        presupuesto.id
                                    }
                                    className="filaPresupuesto"
                                    onClick={() =>
                                        navigate(
                                            `/admin/presupuestos/${presupuesto.id}`
                                        )
                                    }
                                    type="button"
                                >

                                    <strong>
                                        {presupuesto.codigo}
                                    </strong>

                                    <span>
                                        {presupuesto.cliente}
                                    </span>

                                    <span>
                                        {formatearFecha(
                                            presupuesto.fecha
                                        )}
                                    </span>

                                    <strong>
                                        $
                                        {Number(
                                            presupuesto.total || 0
                                        ).toLocaleString(
                                            "es-AR"
                                        )}
                                    </strong>

                                    <span
                                        className={
                                            "estadoPresupuesto " +
                                            obtenerClaseEstado(
                                                presupuesto.estado
                                            )
                                        }
                                    >
                                        {presupuesto.estado ||
                                            "Pendiente"}
                                    </span>

                                </button>

                            )
                        )}

                    </div>

                )}

            </div>


            {/* ACCESOS */}

            <div className="dashboardAccesos">

                <h2>
                    Accesos rápidos
                </h2>

                <div className="dashboardAccesosGrid">

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/admin/clientes"
                            )
                        }
                    >
                        <strong>
                            Clientes
                        </strong>

                        <span>
                            Ver clientes registrados
                        </span>
                    </button>


                    <button
                        type="button"
                        onClick={() =>
                            irATickets()
                        }
                    >
                        <strong>
                            Tickets
                        </strong>

                        <span>
                            Administrar solicitudes
                        </span>
                    </button>


                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/admin/productos"
                            )
                        }
                    >
                        <strong>
                            Productos
                        </strong>

                        <span>
                            Administrar catálogo
                        </span>
                    </button>

                </div>

            </div>

        </section>
    );
}