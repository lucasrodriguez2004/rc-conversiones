import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import "../styles/AdminPresupuestos.css";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const ESTADOS = [
    "Pendiente",
    "Contactado",
    "En revisión",
    "Aprobado",
    "Rechazado"
];

const FILTROS_CONTACTO = [
    "Todos",
    "Sin contactar",
    "WhatsApp",
    "Llamada",
    "Manual"
];

const FILTROS_SEGUIMIENTO = [
    "Todos",
    "Hoy",
    "Vencidos",
    "Programados"
];

export default function AdminPresupuestos() {

    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [presupuestos, setPresupuestos] = useState([]);
    const [busqueda, setBusqueda] = useState("");

    const [filtroEstado, setFiltroEstado] =
        useState("Todos");

    const [filtroContacto, setFiltroContacto] =
        useState("Todos");

    const [filtroSeguimiento, setFiltroSeguimiento] =
        useState("Todos");

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const [actualizandoId, setActualizandoId] =
        useState(null);

    const [registrandoContactoId, setRegistrandoContactoId] =
        useState(null);


    // ==========================================
    // CONTACTO DESDE URL
    // ==========================================

    function obtenerFiltroContactoDesdeUrl(valor) {

        if (valor === "sin") {
            return "Sin contactar";
        }

        if (valor === "whatsapp") {
            return "WhatsApp";
        }

        if (valor === "llamada") {
            return "Llamada";
        }

        if (valor === "manual") {
            return "Manual";
        }

        return "Todos";

    }


    // ==========================================
    // SEGUIMIENTO DESDE URL
    // ==========================================

   function obtenerFiltroSeguimientoDesdeUrl(valor) {

    if (valor === "hoy") {
        return "Hoy";
    }

    if (valor === "vencido") {
        return "Vencidos";
    }

    if (valor === "programado") {
        return "Programados";
    }

    return "Todos";

}

    // ==========================================
    // CARGAR TICKETS
    // ==========================================

    async function cargarPresupuestos() {

        try {

            setError("");

            const response = await fetch(
                `${API}/presupuestos-admin`
            );

            const datos =
                await response.json();

            if (!response.ok || !datos.ok) {

                throw new Error(
                    datos.mensaje ||
                    "No se pudieron cargar los tickets."
                );

            }

            setPresupuestos(
                datos.presupuestos || []
            );

        } catch (err) {

            console.error(
                "Error cargando tickets:",
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

        cargarPresupuestos();

        const intervalo =
            setInterval(() => {

                cargarPresupuestos();

            }, 10000);

        return () => {

            clearInterval(intervalo);

        };

    }, []);


    // ==========================================
    // LEER FILTROS DE URL
    // ==========================================

    useEffect(() => {

        const estadoUrl =
            searchParams.get("estado");

        const contactoUrl =
            searchParams.get("contacto");

        const seguimientoUrl =
            searchParams.get("seguimiento");


        if (
            estadoUrl &&
            ESTADOS.includes(estadoUrl)
        ) {

            setFiltroEstado(
                estadoUrl
            );

        } else {

            setFiltroEstado(
                "Todos"
            );

        }


        setFiltroContacto(
            obtenerFiltroContactoDesdeUrl(
                contactoUrl
            )
        );


        setFiltroSeguimiento(
            obtenerFiltroSeguimientoDesdeUrl(
                seguimientoUrl
            )
        );

    }, [searchParams]);


    // ==========================================
    // CONTACTO A URL
    // ==========================================

    function convertirContactoAUrl(contacto) {

        if (contacto === "Sin contactar") {
            return "sin";
        }

        if (contacto === "WhatsApp") {
            return "whatsapp";
        }

        if (contacto === "Llamada") {
            return "llamada";
        }

        if (contacto === "Manual") {
            return "manual";
        }

        return null;

    }


    // ==========================================
    // SEGUIMIENTO A URL
    // ==========================================

   function convertirSeguimientoAUrl(seguimiento) {

    if (seguimiento === "Hoy") {
        return "hoy";
    }

    if (seguimiento === "Vencidos") {
        return "vencido";
    }

    if (seguimiento === "Programados") {
        return "programado";
    }

    return null;

}


    // ==========================================
    // ACTUALIZAR URL
    // ==========================================

    function actualizarFiltrosUrl(
        estado,
        contacto,
        seguimiento
    ) {

        const parametros = {};

        if (
            estado &&
            estado !== "Todos"
        ) {

            parametros.estado =
                estado;

        }


        const contactoUrl =
            convertirContactoAUrl(
                contacto
            );

        if (contactoUrl) {

            parametros.contacto =
                contactoUrl;

        }


        const seguimientoUrl =
            convertirSeguimientoAUrl(
                seguimiento
            );

        if (seguimientoUrl) {

            parametros.seguimiento =
                seguimientoUrl;

        }


        setSearchParams(
            parametros
        );

    }


    function cambiarFiltroEstado(
        nuevoEstado
    ) {

        setFiltroEstado(
            nuevoEstado
        );

        actualizarFiltrosUrl(
            nuevoEstado,
            filtroContacto,
            filtroSeguimiento
        );

    }


    function cambiarFiltroContacto(
        nuevoContacto
    ) {

        setFiltroContacto(
            nuevoContacto
        );

        actualizarFiltrosUrl(
            filtroEstado,
            nuevoContacto,
            filtroSeguimiento
        );

    }


    function cambiarFiltroSeguimiento(
        nuevoSeguimiento
    ) {

        setFiltroSeguimiento(
            nuevoSeguimiento
        );

        actualizarFiltrosUrl(
            filtroEstado,
            filtroContacto,
            nuevoSeguimiento
        );

    }


    function quitarFiltros() {

        setFiltroEstado(
            "Todos"
        );

        setFiltroContacto(
            "Todos"
        );

        setFiltroSeguimiento(
            "Todos"
        );

        setBusqueda("");

        setSearchParams({});

    }


    // ==========================================
    // PRODUCTOS
    // ==========================================

    function productosCantidad(productos) {

        if (!productos) {
            return 0;
        }

        try {

            const lista =
                Array.isArray(productos)
                    ? productos
                    : JSON.parse(productos);

            if (!Array.isArray(lista)) {
                return 0;
            }

            return lista.reduce(
                (total, producto) =>
                    total +
                    Number(
                        producto.cantidad || 0
                    ),
                0
            );

        } catch {

            return 0;

        }

    }


    // ==========================================
    // ADMIN ACTUAL
    // ==========================================

    function obtenerNombreAdmin() {

        let nombreAdmin =
            "Administrador";

        try {

            const adminGuardado =
                localStorage.getItem(
                    "administrador"
                );

            if (adminGuardado) {

                const admin =
                    JSON.parse(
                        adminGuardado
                    );

                nombreAdmin =
                    admin.nombre ||
                    admin.usuario ||
                    "Administrador";

            }

        } catch (error) {

            console.error(
                "Error leyendo administrador:",
                error
            );

        }

        return nombreAdmin;

    }


    // ==========================================
    // CAMBIAR ESTADO
    // ==========================================

    async function cambiarEstado(
        id,
        nuevoEstado
    ) {

        try {

            setActualizandoId(id);

            const response = await fetch(
                `${API}/presupuestos/${id}/estado`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        estado:
                            nuevoEstado,

                        atendido_por:
                            obtenerNombreAdmin()
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

            await cargarPresupuestos();

        } catch (err) {

            console.error(
                "Error actualizando estado:",
                err
            );

            alert(
                err.message ||
                "No se pudo actualizar el estado."
            );

        } finally {

            setActualizandoId(null);

        }

    }


    // ==========================================
    // REGISTRAR CONTACTO MANUAL
    // ==========================================

    async function registrarContacto(
        presupuestoId
    ) {

        try {

            setRegistrandoContactoId(
                presupuestoId
            );

            const response = await fetch(
                `${API}/presupuestos/${presupuestoId}/contacto`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        atendido_por:
                            obtenerNombreAdmin(),

                        medio:
                            "Manual"
                    })
                }
            );

            const datos =
                await response.json();

            if (!response.ok || !datos.ok) {

                throw new Error(
                    datos.mensaje ||
                    "No se pudo registrar el contacto."
                );

            }

            await cargarPresupuestos();

        } catch (err) {

            console.error(
                "Error registrando contacto:",
                err
            );

            alert(
                err.message ||
                "No se pudo registrar el contacto."
            );

        } finally {

            setRegistrandoContactoId(
                null
            );

        }

    }


    // ==========================================
    // FECHA
    // ==========================================

    function formatearFecha(fecha) {

        if (!fecha) {
            return "Sin registrar";
        }

        const fechaObj =
            new Date(fecha);

        if (
            Number.isNaN(
                fechaObj.getTime()
            )
        ) {
            return "Sin registrar";
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
    // COMPARAR FECHAS
    // ==========================================

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


function seguimientoEsHoy(
    fecha
) {

    if (!fecha) {
        return false;
    }

    const fechaSeguimiento =
        new Date(fecha);

    if (
        Number.isNaN(
            fechaSeguimiento.getTime()
        )
    ) {
        return false;
    }

    const ahora =
        new Date();

    return (
        esMismoDia(
            fechaSeguimiento,
            ahora
        ) &&
        fechaSeguimiento.getTime() >=
            ahora.getTime()
    );

}


   function seguimientoEstaVencido(
    fecha
) {

    if (!fecha) {
        return false;
    }

    const fechaSeguimiento =
        new Date(fecha);

    if (
        Number.isNaN(
            fechaSeguimiento.getTime()
        )
    ) {
        return false;
    }

    return (
        fechaSeguimiento.getTime() <
        Date.now()
    );

}


    // ==========================================
    // MEDIO
    // ==========================================

    function iconoMedio(medio) {

        if (medio === "WhatsApp") {
            return "💬";
        }

        if (medio === "Llamada") {
            return "📞";
        }

        if (medio === "Manual") {
            return "📝";
        }

        return "—";

    }


    // ==========================================
    // CONTADORES
    // ==========================================

    const pendientes =
        presupuestos.filter(
            presupuesto =>
                (
                    presupuesto.estado ||
                    "Pendiente"
                ) === "Pendiente"
        ).length;


    const sinContactar =
        presupuestos.filter(
            presupuesto => {

                const estado =
                    presupuesto.estado ||
                    "Pendiente";

                return (
                    !presupuesto.ultimo_contacto &&
                    estado !== "Aprobado" &&
                    estado !== "Rechazado"
                );

            }
        ).length;


    const seguimientosHoy =
        presupuestos.filter(
            presupuesto => {

                const estado =
                    presupuesto.estado ||
                    "Pendiente";

                return (
                    seguimientoEsHoy(
                        presupuesto.proximo_seguimiento
                    ) &&
                    estado !== "Aprobado" &&
                    estado !== "Rechazado"
                );

            }
        ).length;


    const seguimientosVencidos =
        presupuestos.filter(
            presupuesto => {

                const estado =
                    presupuesto.estado ||
                    "Pendiente";

                return (
                    seguimientoEstaVencido(
                        presupuesto.proximo_seguimiento
                    ) &&
                    estado !== "Aprobado" &&
                    estado !== "Rechazado"
                );

            }
        ).length;


    // ==========================================
// FILTRAR Y ORDENAR POR PRIORIDAD
// ==========================================

const presupuestosFiltrados =
    presupuestos
        .filter(
            presupuesto => {

                const texto =
                    busqueda
                        .toLowerCase()
                        .trim();

                const codigo =
                    String(
                        presupuesto.codigo || ""
                    ).toLowerCase();

                const cliente =
                    String(
                        presupuesto.cliente || ""
                    ).toLowerCase();

                const telefono =
                    String(
                        presupuesto.telefono || ""
                    ).toLowerCase();

                const nota =
                    String(
                        presupuesto.nota_admin || ""
                    ).toLowerCase();

                const atendidoPor =
                    String(
                        presupuesto.atendido_por || ""
                    ).toLowerCase();

                const medio =
                    String(
                        presupuesto.ultimo_medio_contacto || ""
                    ).toLowerCase();


                // ==========================================
                // BÚSQUEDA
                // ==========================================

                const coincideBusqueda =
                    !texto ||
                    codigo.includes(texto) ||
                    cliente.includes(texto) ||
                    telefono.includes(texto) ||
                    nota.includes(texto) ||
                    atendidoPor.includes(texto) ||
                    medio.includes(texto);


                // ==========================================
                // ESTADO
                // ==========================================

                const estado =
                    presupuesto.estado ||
                    "Pendiente";

                const coincideEstado =
                    filtroEstado === "Todos" ||
                    estado === filtroEstado;


                // ==========================================
                // CONTACTO
                // ==========================================

                const estaSinContactar =
                    !presupuesto.ultimo_contacto &&
                    estado !== "Aprobado" &&
                    estado !== "Rechazado";

                let coincideContacto =
                    true;


                if (
                    filtroContacto ===
                    "Sin contactar"
                ) {

                    coincideContacto =
                        estaSinContactar;

                } else if (
                    filtroContacto ===
                    "WhatsApp"
                ) {

                    coincideContacto =
                        presupuesto.ultimo_medio_contacto ===
                        "WhatsApp";

                } else if (
                    filtroContacto ===
                    "Llamada"
                ) {

                    coincideContacto =
                        presupuesto.ultimo_medio_contacto ===
                        "Llamada";

                } else if (
                    filtroContacto ===
                    "Manual"
                ) {

                    coincideContacto =
                        presupuesto.ultimo_medio_contacto ===
                        "Manual";

                }


                // ==========================================
                // SEGUIMIENTO
                // ==========================================

                let coincideSeguimiento =
                    true;

                if (
                    filtroSeguimiento ===
                    "Hoy"
                ) {

                    coincideSeguimiento =
                        seguimientoEsHoy(
                            presupuesto.proximo_seguimiento
                        ) &&
                        estado !== "Aprobado" &&
                        estado !== "Rechazado";

                } else if (
                    filtroSeguimiento ===
                    "Vencidos"
                ) {

                    coincideSeguimiento =
                        seguimientoEstaVencido(
                            presupuesto.proximo_seguimiento
                        ) &&
                        estado !== "Aprobado" &&
                        estado !== "Rechazado";

                } else if (
                    filtroSeguimiento ===
                    "Programados"
                ) {

                    if (
                        !presupuesto.proximo_seguimiento ||
                        estado === "Aprobado" ||
                        estado === "Rechazado"
                    ) {

                        coincideSeguimiento = false;

                    } else {

                        const fechaSeguimiento =
                            new Date(
                                presupuesto.proximo_seguimiento
                            );

                        coincideSeguimiento =
                            !Number.isNaN(
                                fechaSeguimiento.getTime()
                            ) &&
                            fechaSeguimiento.getTime() >
                                Date.now() &&
                            !seguimientoEsHoy(
                                presupuesto.proximo_seguimiento
                            );

                    }

                }

                return (
                    coincideBusqueda &&
                    coincideEstado &&
                    coincideContacto &&
                    coincideSeguimiento
                );

            }
        )
        .sort(
            (a, b) => {

                // ==========================================
                // CALCULAR PRIORIDAD
                // Menor número = más urgente
                // ==========================================

                function prioridad(
                    presupuesto
                ) {

                    const estado =
                        presupuesto.estado ||
                        "Pendiente";


                    // Estados terminados siempre al final.

                    if (
                        estado === "Aprobado" ||
                        estado === "Rechazado"
                    ) {

                        return 50;

                    }


                    // 1. Seguimiento vencido

                    if (
                        seguimientoEstaVencido(
                            presupuesto.proximo_seguimiento
                        )
                    ) {

                        return 1;

                    }


                    // 2. Seguimiento de hoy

                    if (
                        seguimientoEsHoy(
                            presupuesto.proximo_seguimiento
                        )
                    ) {

                        return 2;

                    }


                    // 3. Sin contactar

                    if (
                        !presupuesto.ultimo_contacto
                    ) {

                        return 3;

                    }


                    // 4. Pendiente

                    if (
                        estado === "Pendiente"
                    ) {

                        return 4;

                    }


                    // 5. Contactado

                    if (
                        estado === "Contactado"
                    ) {

                        return 5;

                    }


                    // 6. En revisión

                    if (
                        estado === "En revisión"
                    ) {

                        return 6;

                    }


                    return 20;

                }


                const prioridadA =
                    prioridad(a);

                const prioridadB =
                    prioridad(b);


                // Primero comparamos prioridad.

                if (
                    prioridadA !==
                    prioridadB
                ) {

                    return (
                        prioridadA -
                        prioridadB
                    );

                }


                // ==========================================
                // MISMA PRIORIDAD:
                // ORDENAR POR SEGUIMIENTO MÁS CERCANO
                // ==========================================

                const fechaSeguimientoA =
                    a.proximo_seguimiento
                        ? new Date(
                            a.proximo_seguimiento
                        ).getTime()
                        : null;

                const fechaSeguimientoB =
                    b.proximo_seguimiento
                        ? new Date(
                            b.proximo_seguimiento
                        ).getTime()
                        : null;


                if (
                    fechaSeguimientoA !== null &&
                    fechaSeguimientoB !== null &&
                    !Number.isNaN(
                        fechaSeguimientoA
                    ) &&
                    !Number.isNaN(
                        fechaSeguimientoB
                    )
                ) {

                    if (
                        fechaSeguimientoA !==
                        fechaSeguimientoB
                    ) {

                        return (
                            fechaSeguimientoA -
                            fechaSeguimientoB
                        );

                    }

                }


                // ==========================================
                // SI SIGUEN EMPATADOS:
                // TICKET MÁS NUEVO PRIMERO
                // ==========================================

                return (
                    Number(b.id || 0) -
                    Number(a.id || 0)
                );

            }
        );


    // ==========================================
    // CLASE ESTADO
    // ==========================================

    function claseEstado(estado) {

        return (
            "badgeEstado " +
            String(
                estado || "Pendiente"
            )
                .toLowerCase()
                .replace(/\s+/g, "-")
        );

    }


    if (cargando) {

        return (
            <section className="adminPresupuestos">

                <h1>
                    Tickets
                </h1>

                <p>
                    Cargando tickets...
                </p>

            </section>
        );

    }


    return (
        <section className="adminPresupuestos">


            {/* CABECERA */}

            <div className="adminPresupuestosHeader">

                <div>

                    <h1>
                        Tickets
                    </h1>

                    <p>
                        Solicitudes de presupuesto
                        de los clientes.
                    </p>

                </div>

                <button
                    className="actualizarPresupuestos"
                    onClick={
                        cargarPresupuestos
                    }
                    type="button"
                >
                    Actualizar
                </button>

            </div>


            {/* SEGUIMIENTOS VENCIDOS */}

            {seguimientosVencidos > 0 && (

                <button
                    className="alertaSeguimientoLista alertaSeguimientoVencidoLista"
                    type="button"
                    onClick={() =>
                        cambiarFiltroSeguimiento(
                            "Vencidos"
                        )
                    }
                >

                    <strong>
                        ⚠ {seguimientosVencidos} seguimiento
                        {seguimientosVencidos !== 1
                            ? "s"
                            : ""}{" "}
                        vencido
                        {seguimientosVencidos !== 1
                            ? "s"
                            : ""}
                    </strong>

                    <span>
                        Mostrar seguimientos vencidos
                    </span>

                </button>

            )}


            {/* SEGUIMIENTOS HOY */}

            {seguimientosHoy > 0 && (

                <button
                    className="alertaSeguimientoLista alertaSeguimientoHoyLista"
                    type="button"
                    onClick={() =>
                        cambiarFiltroSeguimiento(
                            "Hoy"
                        )
                    }
                >

                    <strong>
                        📅 {seguimientosHoy} seguimiento
                        {seguimientosHoy !== 1
                            ? "s"
                            : ""}{" "}
                        para hoy
                    </strong>

                    <span>
                        Mostrar seguimientos de hoy
                    </span>

                </button>

            )}


            {/* SIN CONTACTAR */}

            {sinContactar > 0 && (

                <button
                    className="alertaSinContactarLista"
                    type="button"
                    onClick={() =>
                        cambiarFiltroContacto(
                            "Sin contactar"
                        )
                    }
                >

                    <strong>
                        ⚠ {sinContactar} ticket
                        {sinContactar !== 1
                            ? "s"
                            : ""}{" "}
                        sin contactar
                    </strong>

                    <span>
                        Mostrar solamente estos tickets
                    </span>

                </button>

            )}


            {/* PENDIENTES */}

            {pendientes > 0 && (

                <div className="nuevasSolicitudes">

                    <strong>
                        🔔 {pendientes} solicitud
                        {pendientes !== 1
                            ? "es"
                            : ""}{" "}
                        pendiente
                        {pendientes !== 1
                            ? "s"
                            : ""}
                    </strong>

                    <span>
                        Hay tickets esperando atención.
                    </span>

                </div>

            )}


            {/* FILTROS */}

            <div className="filtrosPresupuestos">

                <input
                    type="text"
                    placeholder="Buscar por cliente, teléfono, código, nota, administrador o medio..."
                    value={busqueda}
                    onChange={(e) =>
                        setBusqueda(
                            e.target.value
                        )
                    }
                />


                <select
                    value={filtroEstado}
                    onChange={(e) =>
                        cambiarFiltroEstado(
                            e.target.value
                        )
                    }
                >

                    <option value="Todos">
                        Todos los estados
                    </option>

                    {ESTADOS.map(
                        estado => (

                            <option
                                key={estado}
                                value={estado}
                            >
                                {estado}
                            </option>

                        )
                    )}

                </select>


                <select
                    value={filtroContacto}
                    onChange={(e) =>
                        cambiarFiltroContacto(
                            e.target.value
                        )
                    }
                >

                    {FILTROS_CONTACTO.map(
                        contacto => (

                            <option
                                key={contacto}
                                value={contacto}
                            >

                                {contacto === "Todos"
                                    ? "Todos los contactos"
                                    : contacto === "WhatsApp"
                                        ? "💬 WhatsApp"
                                        : contacto === "Llamada"
                                            ? "📞 Llamada"
                                            : contacto === "Manual"
                                                ? "📝 Manual"
                                                : "Sin contactar"
                                }

                            </option>

                        )
                    )}

                </select>


                <select
                    value={filtroSeguimiento}
                    onChange={(e) =>
                        cambiarFiltroSeguimiento(
                            e.target.value
                        )
                    }
                >

                    {FILTROS_SEGUIMIENTO.map(
                        seguimiento => (

                            <option
                                key={seguimiento}
                                value={seguimiento}
                            >

                                {seguimiento === "Todos"
                                    ? "Todos los seguimientos"
                                    : seguimiento === "Hoy"
                                        ? "📅 Seguimientos de hoy"
                                        : seguimiento === "Vencidos"
                                            ? "⚠ Seguimientos vencidos"
                                            : "🕒 Seguimientos programados"
                                }

                            </option>

                        )
                    )}

                </select>

            </div>


            {/* FILTROS ACTIVOS */}

            {(
                filtroEstado !== "Todos" ||
                filtroContacto !== "Todos" ||
                filtroSeguimiento !== "Todos" ||
                busqueda
            ) && (

                <div className="filtroActivoPresupuestos">

                    <span>
                        Filtros:
                    </span>

                    {filtroEstado !== "Todos" && (
                        <strong>
                            {filtroEstado}
                        </strong>
                    )}

                    {filtroContacto !== "Todos" && (
                        <strong>
                            {filtroContacto}
                        </strong>
                    )}

                    {filtroSeguimiento !== "Todos" && (
                        <strong>
                            {filtroSeguimiento === "Hoy"
                                ? "📅 Seguimientos hoy"
                                : filtroSeguimiento === "Vencidos"
                                    ? "⚠ Seguimientos vencidos"
                                    : "🕒 Seguimientos programados"
                            }
                        </strong>
                    )}

                    {busqueda && (
                        <strong>
                            Búsqueda: {busqueda}
                        </strong>
                    )}

                    <button
                        type="button"
                        onClick={
                            quitarFiltros
                        }
                    >
                        Quitar filtros
                    </button>

                </div>

            )}


            {/* ERROR */}

            {error && (

                <div className="presupuestosError">
                    {error}
                </div>

            )}


            {/* CONTADOR */}

            <div className="contadorPresupuestos">

                Mostrando{" "}

                <strong>
                    {presupuestosFiltrados.length}
                </strong>

                {" "}de{" "}

                <strong>
                    {presupuestos.length}
                </strong>

                {" "}tickets

            </div>


            {/* LISTA */}

            {presupuestosFiltrados.length === 0 ? (

                <div className="sinPresupuestos">

                    <h3>
                        No hay tickets
                    </h3>

                    <p>
                        No encontramos solicitudes
                        con esos filtros.
                    </p>

                </div>

            ) : (

                <div className="listaPresupuestos">

                    {presupuestosFiltrados.map(
                        presupuesto => {

                            const estado =
                                presupuesto.estado ||
                                "Pendiente";

                            const esNuevo =
                                estado === "Pendiente";

                            const tieneNota =
                                Boolean(
                                    presupuesto.nota_admin &&
                                    presupuesto.nota_admin.trim()
                                );

                            const tieneContacto =
                                Boolean(
                                    presupuesto.ultimo_contacto
                                );

                            const ultimoMedio =
                                presupuesto.ultimo_medio_contacto ||
                                null;

                            const seguimientoHoy =
                                seguimientoEsHoy(
                                    presupuesto.proximo_seguimiento
                                );

                            const seguimientoVencido =
                                seguimientoEstaVencido(
                                    presupuesto.proximo_seguimiento
                                );

                            return (

                                <article
                                    className={
                                        `presupuestoAdminCard ${
                                            esNuevo
                                                ? "ticketNuevo"
                                                : ""
                                        } ${
                                            seguimientoVencido
                                                ? "ticketSeguimientoVencido"
                                                : ""
                                        }`
                                    }
                                    key={
                                        presupuesto.id
                                    }
                                >


                                    {/* NUEVO */}

                                    {esNuevo && (

                                        <div className="nuevoTicketBadge">
                                            NUEVA SOLICITUD
                                        </div>

                                    )}


                                    {/* SEGUIMIENTO BADGE */}

                                    {seguimientoVencido && (

                                        <div className="seguimientoListaBadge vencido">
                                            ⚠ SEGUIMIENTO VENCIDO
                                        </div>

                                    )}

                                    {!seguimientoVencido &&
                                    seguimientoHoy && (

                                        <div className="seguimientoListaBadge hoy">
                                            📅 SEGUIMIENTO HOY
                                        </div>

                                    )}


                                    {/* TOP */}

                                    <div className="presupuestoAdminTop">

                                        <div>

                                            <span className="codigoAdmin">
                                                {presupuesto.codigo}
                                            </span>

                                            <small>
                                                Ticket #{presupuesto.id}
                                            </small>

                                        </div>

                                        <span
                                            className={
                                                claseEstado(
                                                    estado
                                                )
                                            }
                                        >
                                            {estado}
                                        </span>

                                    </div>


                                    {/* DATOS */}

                                    <div className="datosPresupuestoAdmin">

                                        <div>

                                            <span>
                                                Cliente
                                            </span>

                                            <strong>
                                                {presupuesto.cliente}
                                            </strong>

                                        </div>

                                        <div>

                                            <span>
                                                Teléfono
                                            </span>

                                            <strong>
                                                {presupuesto.telefono || "-"}
                                            </strong>

                                        </div>

                                        <div>

                                            <span>
                                                Productos
                                            </span>

                                            <strong>
                                                {productosCantidad(
                                                    presupuesto.productos
                                                )}
                                            </strong>

                                        </div>

                                        <div>

                                            <span>
                                                Total
                                            </span>

                                            <strong className="totalAdmin">

                                                $
                                                {Number(
                                                    presupuesto.total || 0
                                                ).toLocaleString(
                                                    "es-AR"
                                                )}

                                            </strong>

                                        </div>

                                        <div>

                                            <span>
                                                Fecha
                                            </span>

                                            <strong>
                                                {formatearFecha(
                                                    presupuesto.fecha
                                                )}
                                            </strong>

                                        </div>

                                    </div>


                                    {/* SEGUIMIENTO */}

                                    {presupuesto.proximo_seguimiento && (

                                        <div
                                            className={
                                                `seguimientoResumenLista ${
                                                    seguimientoVencido
                                                        ? "vencido"
                                                        : seguimientoHoy
                                                            ? "hoy"
                                                            : ""
                                                }`
                                            }
                                        >

                                            <span>
                                                Próximo seguimiento
                                            </span>

                                            <strong>
                                                {formatearFecha(
                                                    presupuesto.proximo_seguimiento
                                                )}
                                            </strong>

                                        </div>

                                    )}


                                    {/* CONTACTO */}

                                    <div className="contactoResumenTicket contactoResumenTicketTres">

                                        <div>

                                            <span>
                                                Atendido por
                                            </span>

                                            <strong>
                                                {presupuesto.atendido_por ||
                                                    "Sin registrar"}
                                            </strong>

                                        </div>

                                        <div>

                                            <span>
                                                Último contacto
                                            </span>

                                            <strong>
                                                {formatearFecha(
                                                    presupuesto.ultimo_contacto
                                                )}
                                            </strong>

                                        </div>

                                        <div>

                                            <span>
                                                Último medio
                                            </span>

                                            <strong className="ultimoMedioContacto">

                                                <span>
                                                    {iconoMedio(
                                                        ultimoMedio
                                                    )}
                                                </span>

                                                {ultimoMedio ||
                                                    "Sin registrar"}

                                            </strong>

                                        </div>

                                    </div>


                                    {!tieneContacto && (

                                        <div className="sinContactoAviso">

                                            <strong>
                                                Sin contactar
                                            </strong>

                                            <span>
                                                Todavía no se registró
                                                contacto con este cliente.
                                            </span>

                                        </div>

                                    )}


                                    {/* REGISTRAR */}

                                    <button
                                        type="button"
                                        className="registrarContactoListaBtn"
                                        disabled={
                                            registrandoContactoId ===
                                            presupuesto.id
                                        }
                                        onClick={() =>
                                            registrarContacto(
                                                presupuesto.id
                                            )
                                        }
                                    >

                                        {registrandoContactoId ===
                                        presupuesto.id
                                            ? "Registrando..."
                                            : tieneContacto
                                                ? "Registrar nuevo contacto manual"
                                                : "Registrar contacto manual"
                                        }

                                    </button>


                                    {/* ATENCIÓN */}

                                    {esNuevo && (

                                        <div className="avisoAtencion">

                                            <strong>
                                                Atención requerida
                                            </strong>

                                            <span>
                                                El cliente está esperando
                                                que un asesor se comunique
                                                con él.
                                            </span>

                                        </div>

                                    )}


                                    {/* CONTACTADO */}

                                    {estado === "Pendiente" && (

                                        <button
                                            type="button"
                                            className="marcarContactadoBtn"
                                            disabled={
                                                actualizandoId ===
                                                presupuesto.id
                                            }
                                            onClick={() =>
                                                cambiarEstado(
                                                    presupuesto.id,
                                                    "Contactado"
                                                )
                                            }
                                        >

                                            {actualizandoId ===
                                            presupuesto.id
                                                ? "Guardando..."
                                                : "✓ Marcar como Contactado"
                                            }

                                        </button>

                                    )}


                                    {/* NOTA */}

                                    {tieneNota && (

                                        <div className="notaAdminResumen">

                                            <span>
                                                Nota interna
                                            </span>

                                            <p>
                                                {presupuesto.nota_admin}
                                            </p>

                                        </div>

                                    )}


                                    {/* ESTADOS */}

                                    <div className="cambiarEstadoAdmin">

                                        <span>
                                            Estado
                                        </span>

                                        <div className="estadoButtons">

                                            {ESTADOS.map(
                                                estadoDisponible => (

                                                    <button
                                                        key={
                                                            estadoDisponible
                                                        }
                                                        type="button"
                                                        disabled={
                                                            actualizandoId ===
                                                                presupuesto.id ||
                                                            estado ===
                                                                estadoDisponible
                                                        }
                                                        className={
                                                            estado ===
                                                            estadoDisponible
                                                                ? "estadoActivo"
                                                                : ""
                                                        }
                                                        onClick={() =>
                                                            cambiarEstado(
                                                                presupuesto.id,
                                                                estadoDisponible
                                                            )
                                                        }
                                                    >
                                                        {estadoDisponible}
                                                    </button>

                                                )
                                            )}

                                        </div>

                                    </div>


                                    {/* ACCIONES */}

                                    <div className="accionesPresupuesto">

                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    `/admin/presupuestos/${presupuesto.id}`
                                                )
                                            }
                                        >
                                            Ver detalle
                                        </button>

                                        {presupuesto.cliente_id && (

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(
                                                        `/admin/clientes/${presupuesto.cliente_id}`
                                                    )
                                                }
                                            >
                                                Ver cliente
                                            </button>

                                        )}

                                    </div>

                                </article>

                            );

                        }
                    )}

                </div>

            )}

        </section>
    );
}