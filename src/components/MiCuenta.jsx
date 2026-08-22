import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import "../styles/MiCuenta.css";
import "../styles/TicketConfirmacion.css";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export default function MiCuenta() {

    const navigate = useNavigate();
    const location = useLocation();

    const [cliente, setCliente] = useState(null);

    const [
        confirmacionTicket,
        setConfirmacionTicket
    ] = useState(null);
    const [presupuestos, setPresupuestos] = useState([]);
    const [historiales, setHistoriales] = useState({});
    const [cargando, setCargando] = useState(true);

    // ==========================================
    // CONFIRMACIÓN DE TICKET RECIÉN GENERADO
    // ==========================================

    useEffect(() => {

        let confirmacion =
            location.state?.ticketGenerado ||
            null;

        if (!confirmacion) {

            const confirmacionGuardada =
                localStorage.getItem(
                    "ticket_recien_generado"
                );

            if (confirmacionGuardada) {

                try {

                    confirmacion =
                        JSON.parse(
                            confirmacionGuardada
                        );

                } catch (error) {

                    console.error(
                        "Error leyendo confirmación del ticket:",
                        error
                    );

                    localStorage.removeItem(
                        "ticket_recien_generado"
                    );

                }

            }

        }

        if (confirmacion?.codigo) {

            setConfirmacionTicket(
                confirmacion
            );

        }

    }, [location.state]);


    useEffect(() => {

        let activo = true;
        let intervalo = null;


        async function iniciarCuenta() {

            const token =
                localStorage.getItem(
                    "cliente_token"
                );


            if (!token) {

                localStorage.removeItem(
                    "cliente"
                );

                navigate(
                    "/login",
                    {
                        replace: true
                    }
                );

                return;

            }


            try {

                setCargando(true);


                // ======================================
                // DATOS REALES DEL CLIENTE
                // EL ID VIENE DEL JWT, NO DEL LOCALSTORAGE
                // ======================================

                const response =
                    await fetch(
                        `${API}/clientes/me`
                    );


                const datos =
                    await response.json();


                if (
                    !response.ok ||
                    !datos.ok ||
                    !datos.cliente
                ) {

                    throw new Error(
                        datos.mensaje ||
                        "No se pudo validar la sesión."
                    );

                }


                if (!activo) {
                    return;
                }


                const clienteReal =
                    datos.cliente;


                setCliente(
                    clienteReal
                );


                // Se conserva para mostrar datos y para
                // compatibilidad con el resto de la UI,
                // pero ya no es la fuente de autorización.

                localStorage.setItem(
                    "cliente",
                    JSON.stringify(
                        clienteReal
                    )
                );


                await cargarPresupuestos(
                    clienteReal.id
                );


                if (!activo) {
                    return;
                }


                intervalo =
                    setInterval(() => {

                        cargarPresupuestos(
                            clienteReal.id
                        );

                    }, 10000);


            } catch (error) {

                if (!activo) {
                    return;
                }


                console.error(
                    "Error validando cuenta:",
                    error
                );


                localStorage.removeItem(
                    "cliente_token"
                );

                localStorage.removeItem(
                    "cliente"
                );


                navigate(
                    "/login",
                    {
                        replace: true
                    }
                );

            }

        }


        iniciarCuenta();


        return () => {

            activo = false;

            if (intervalo) {
                clearInterval(
                    intervalo
                );
            }

        };


    }, [navigate]);


    // ==========================================
    // CARGAR TICKETS
    // ==========================================

    async function cargarPresupuestos(clienteId) {

        try {

            const response = await fetch(
                `${API}/presupuestos/cliente/${clienteId}`
            );

            const datos =
                await response.json();

            if (!response.ok || !datos.ok) {

                throw new Error(
                    datos.mensaje ||
                    "No se pudieron obtener los tickets."
                );

            }

            const lista =
                datos.presupuestos || [];

            setPresupuestos(lista);

            // Cargar historial de cada ticket
            await cargarHistoriales(
                lista,
                clienteId
            );

        } catch (error) {

            console.error(
                "Error cargando tickets:",
                error
            );

            setPresupuestos([]);

        } finally {

            setCargando(false);

        }

    }


    // ==========================================
    // CARGAR HISTORIALES
    // ==========================================

    async function cargarHistoriales(
        lista,
        clienteId
    ) {

        if (!Array.isArray(lista) || lista.length === 0) {

            setHistoriales({});

            return;

        }

        const resultados = {};

        await Promise.all(
            lista.map(async (presupuesto) => {

                try {

                    const response =
                        await fetch(
                            `${API}/presupuestos/cliente/${clienteId}/${presupuesto.id}/historial`
                        );

                    const datos =
                        await response.json();

                    if (
                        response.ok &&
                        datos.ok
                    ) {

                        resultados[presupuesto.id] =
                            datos.historial || [];

                    }

                } catch (error) {

                    console.error(
                        `Error cargando historial ${presupuesto.id}:`,
                        error
                    );

                    resultados[presupuesto.id] = [];

                }

            })
        );

        setHistoriales(resultados);

    }


    // ==========================================
    // CERRAR SESIÓN
    // ==========================================

    function cerrarSesion() {

        localStorage.removeItem(
            "cliente_token"
        );

        localStorage.removeItem(
            "cliente"
        );

        localStorage.removeItem(
            "ticket_recien_generado"
        );

        setCliente(null);

        navigate("/login");

    }


    // ==========================================
    // CERRAR CONFIRMACIÓN DEL TICKET
    // ==========================================

    function cerrarConfirmacionTicket() {

        setConfirmacionTicket(null);

        localStorage.removeItem(
            "ticket_recien_generado"
        );

        navigate(
            location.pathname,
            {
                replace: true,
                state: null
            }
        );

    }


    // ==========================================
    // FECHA
    // ==========================================

    function formatearFecha(fecha) {

        if (!fecha) {
            return "Sin fecha";
        }

        const fechaObj =
            new Date(fecha);

        if (
            Number.isNaN(
                fechaObj.getTime()
            )
        ) {

            return "Sin fecha";

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
    // ESTADO
    // ==========================================

    function claseEstado(estado) {

        switch (estado) {

            case "Aprobado":
                return "estadoAprobado";

            case "Rechazado":
                return "estadoRechazado";

            case "En revisión":
                return "estadoRevision";

            case "Contactado":
                return "estadoContactado";

            default:
                return "estadoPendiente";

        }

    }


    // ==========================================
    // PRODUCTOS
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


    if (!cliente) {

        return (

            <div className="miCuentaPage">

                <p>
                    Cargando cuenta...
                </p>

            </div>

        );

    }


    return (

        <section className="miCuentaPage">

            <div className="miCuentaContainer">

                {/* ==================================
                    CABECERA
                ================================== */}

                <div className="cuentaHeader">

                    <div>

                        <h1>
                            Mi cuenta
                        </h1>

                        <p>
                            Bienvenido, {cliente.nombre}
                        </p>

                    </div>

                    <button
                        className="cerrarSesion"
                        onClick={cerrarSesion}
                        type="button"
                    >
                        Cerrar sesión
                    </button>

                </div>


                {/* ==================================
                    CONFIRMACIÓN DE TICKET
                ================================== */}

                {confirmacionTicket && (

                    <div
                        className="ticketConfirmacionCliente"
                        role="status"
                    >

                        <div className="ticketConfirmacionIcono">
                            ✓
                        </div>

                        <div className="ticketConfirmacionContenido">

                            <span className="ticketConfirmacionEtiqueta">
                                SOLICITUD RECIBIDA
                            </span>

                            <h2>
                                Tu presupuesto fue solicitado correctamente
                            </h2>

                            <p>
                                Recibimos tu solicitud. Un asesor de
                                RC Conversiones se comunicará con vos
                                a la brevedad para continuar con la atención.
                            </p>

                            <div className="ticketConfirmacionCodigo">

                                <span>
                                    Número de ticket
                                </span>

                                <strong>
                                    {confirmacionTicket.codigo}
                                </strong>

                            </div>

                            {confirmacionTicket.total !== undefined &&
                            confirmacionTicket.total !== null && (

                                <div className="ticketConfirmacionTotal">

                                    <span>
                                        Total estimado
                                    </span>

                                    <strong>
                                        $
                                        {Number(
                                            confirmacionTicket.total || 0
                                        ).toLocaleString(
                                            "es-AR"
                                        )}
                                    </strong>

                                </div>

                            )}

                            <button
                                type="button"
                                className="ticketConfirmacionBoton"
                                onClick={
                                    cerrarConfirmacionTicket
                                }
                            >
                                Entendido, ver mi solicitud
                            </button>

                        </div>

                    </div>

                )}


                {/* ==================================
                    DATOS CLIENTE
                ================================== */}

                <div className="datosCliente">

                    <h2>
                        Mis datos
                    </h2>

                    <div className="datosGrid">

                        <div>

                            <span>
                                Nombre
                            </span>

                            <strong>
                                {cliente.nombre}
                            </strong>

                        </div>

                        <div>

                            <span>
                                Correo
                            </span>

                            <strong>
                                {cliente.email || "-"}
                            </strong>

                        </div>

                        <div>

                            <span>
                                Teléfono
                            </span>

                            <strong>
                                {cliente.telefono || "-"}
                            </strong>

                        </div>

                        <div>

                            <span>
                                Estado de cuenta
                            </span>

                            <strong className="cuentaVerificada">

                                {Number(cliente.verificado) === 1
                                    ? "✓ Verificada"
                                    : "Pendiente"}

                            </strong>

                        </div>

                    </div>

                </div>


                {/* ==================================
                    TICKETS
                ================================== */}

                <div className="presupuestosSection">

                    <div className="presupuestosHeader">

                        <div>

                            <h2>
                                Mis tickets
                            </h2>

                            <p>
                                Acá podés consultar el estado
                                de tus solicitudes.
                            </p>

                        </div>

                        <span>
                            {presupuestos.length}{" "}
                            ticket
                            {presupuestos.length !== 1
                                ? "s"
                                : ""}
                        </span>

                    </div>


                    {cargando ? (

                        <p className="estado">
                            Cargando tickets...
                        </p>

                    ) : presupuestos.length === 0 ? (

                        <div className="sinPresupuestos">

                            <h3>
                                Todavía no tenés tickets
                            </h3>

                            <p>
                                Agregá productos al carrito
                                para solicitar un presupuesto.
                            </p>

                            <Link
                                to="/"
                                className="volverCatalogo"
                            >
                                Ver productos
                            </Link>

                        </div>

                    ) : (

                        <div className="presupuestosLista">

                            {presupuestos.map(
                                (presupuesto) => {

                                    const productos =
                                        obtenerProductos(
                                            presupuesto.productos
                                        );

                                    const historial =
                                        historiales[
                                            presupuesto.id
                                        ] || [];

                                    const estadoActual =
                                        presupuesto.estado ||
                                        "Pendiente";

                                    return (

                                        <div
                                            className="presupuestoCard"
                                            key={
                                                presupuesto.id
                                            }
                                        >

                                            {/* ==========================
                                                CABECERA
                                            =========================== */}

                                            <div className="presupuestoTop">

                                                <div>

                                                    <span>
                                                        Número de ticket
                                                    </span>

                                                    <h3>
                                                        {
                                                            presupuesto.codigo
                                                        }
                                                    </h3>

                                                </div>

                                                <span
                                                    className={
                                                        `estadoPresupuesto ${
                                                            claseEstado(
                                                                estadoActual
                                                            )
                                                        }`
                                                    }
                                                >
                                                    {
                                                        estadoActual
                                                    }
                                                </span>

                                            </div>


                                            {/* ==========================
                                                AVISO
                                            =========================== */}

                                            {estadoActual === "Pendiente" && (

                                                <div className="ticketNotice">

                                                    <strong>
                                                        Solicitud recibida.
                                                    </strong>

                                                    <span>
                                                        Un asesor de
                                                        RC Conversiones
                                                        se comunicará
                                                        con vos.
                                                    </span>

                                                </div>

                                            )}

                                            {estadoActual === "Contactado" && (

                                                <div className="ticketNotice">

                                                    <strong>
                                                        Un asesor ya se
                                                        comunicó con vos.
                                                    </strong>

                                                    <span>
                                                        Tu solicitud
                                                        continúa en
                                                        seguimiento.
                                                    </span>

                                                </div>

                                            )}

                                            {estadoActual === "En revisión" && (

                                                <div className="ticketNotice">

                                                    <strong>
                                                        Tu presupuesto
                                                        está en revisión.
                                                    </strong>

                                                    <span>
                                                        Estamos analizando
                                                        tu solicitud.
                                                    </span>

                                                </div>

                                            )}

                                            {estadoActual === "Aprobado" && (

                                                <div className="ticketNotice ticketAprobado">

                                                    <strong>
                                                        ¡Presupuesto aprobado!
                                                    </strong>

                                                    <span>
                                                        Un asesor se pondrá
                                                        en contacto para
                                                        continuar.
                                                    </span>

                                                </div>

                                            )}

                                            {estadoActual === "Rechazado" && (

                                                <div className="ticketNotice ticketRechazado">

                                                    <strong>
                                                        Solicitud rechazada.
                                                    </strong>

                                                    <span>
                                                        Contactate con
                                                        RC Conversiones
                                                        para recibir más
                                                        información.
                                                    </span>

                                                </div>

                                            )}


                                            {/* ==========================
                                                INFORMACIÓN
                                            =========================== */}

                                            <div className="presupuestoInfo">

                                                <div>

                                                    <span>
                                                        Fecha de solicitud
                                                    </span>

                                                    <strong className="ticketFecha">
                                                        {
                                                            formatearFecha(
                                                                presupuesto.fecha
                                                            )
                                                        }
                                                    </strong>

                                                </div>

                                                <div>

                                                    <span>
                                                        Total estimado
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

                                            </div>


                                            {/* ==========================
                                                HISTORIAL
                                            =========================== */}

                                            <div className="historialCliente">

                                                <h4>
                                                    Seguimiento
                                                </h4>

                                                {historial.length === 0 ? (

                                                    <p className="historialClienteVacio">
                                                        Todavía no hay
                                                        movimientos registrados.
                                                    </p>

                                                ) : (

                                                    <div className="historialClienteTimeline">

                                                        {historial.map(
                                                            (item, index) => (

                                                                <div
                                                                    className="historialClienteItem"
                                                                    key={
                                                                        item.id
                                                                    }
                                                                >

                                                                    <div
                                                                        className={
                                                                            `historialClientePunto ${
                                                                                index ===
                                                                                historial.length -
                                                                                    1
                                                                                    ? "actual"
                                                                                    : ""
                                                                            }`
                                                                        }
                                                                    />

                                                                    <div className="historialClienteContenido">

                                                                        <strong>
                                                                            {
                                                                                item.estado
                                                                            }
                                                                        </strong>

                                                                        <span>
                                                                            {
                                                                                formatearFecha(
                                                                                    item.fecha
                                                                                )
                                                                            }
                                                                        </span>

                                                                    </div>

                                                                </div>

                                                            )
                                                        )}

                                                    </div>

                                                )}

                                            </div>


                                            {/* ==========================
                                                PRODUCTOS
                                            =========================== */}

                                            <div className="productosPresupuesto">

                                                <h4>
                                                    Productos solicitados
                                                </h4>

                                                {productos.length === 0 ? (

                                                    <p>
                                                        No hay productos registrados.
                                                    </p>

                                                ) : (

                                                    productos.map(
                                                        (
                                                            producto,
                                                            index
                                                        ) => (

                                                            <div
                                                                className="productoPresupuesto"
                                                                key={
                                                                    `${presupuesto.id}-${index}`
                                                                }
                                                            >

                                                                <span>
                                                                    {
                                                                        producto.nombre ||
                                                                        "Producto"
                                                                    }
                                                                </span>

                                                                <span>
                                                                    x
                                                                    {
                                                                        producto.cantidad ||
                                                                        1
                                                                    }
                                                                </span>

                                                            </div>

                                                        )
                                                    )

                                                )}

                                            </div>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    )}

                </div>

            </div>

        </section>

    );

}