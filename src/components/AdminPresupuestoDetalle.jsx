import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "../styles/AdminPresupuestoDetalle.css";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const ESTADOS = [
    "Pendiente",
    "Contactado",
    "En revisión",
    "Aprobado",
    "Rechazado"
];

export default function AdminPresupuestoDetalle() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [presupuesto, setPresupuesto] = useState(null);

    const [historial, setHistorial] = useState([]);
    const [contactos, setContactos] = useState([]);
    const [seguimientosHistorial, setSeguimientosHistorial] =
        useState([]);

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const [actualizandoEstado, setActualizandoEstado] =
        useState(false);

    const [mensajeEstado, setMensajeEstado] =
        useState("");

    const [notaAdmin, setNotaAdmin] =
        useState("");

    const [guardandoNota, setGuardandoNota] =
        useState(false);

    const [mensajeNota, setMensajeNota] =
        useState("");

    const [registrandoContacto, setRegistrandoContacto] =
        useState(false);

    const [mensajeContacto, setMensajeContacto] =
        useState("");

    const [seguimiento, setSeguimiento] =
        useState("");

    const [guardandoSeguimiento, setGuardandoSeguimiento] =
        useState(false);

    const [mensajeSeguimiento, setMensajeSeguimiento] =
        useState("");

    const [
        completarSeguimientoAlContactar,
        setCompletarSeguimientoAlContactar
    ] = useState(false);


    function convertirParaInput(fecha) {

        if (!fecha) {
            return "";
        }

        const fechaObj = new Date(fecha);

        if (Number.isNaN(fechaObj.getTime())) {
            return "";
        }

        const dosDigitos = numero =>
            String(numero).padStart(2, "0");

        return (
            `${fechaObj.getFullYear()}-` +
            `${dosDigitos(fechaObj.getMonth() + 1)}-` +
            `${dosDigitos(fechaObj.getDate())}T` +
            `${dosDigitos(fechaObj.getHours())}:` +
            `${dosDigitos(fechaObj.getMinutes())}`
        );
    }


    async function cargarPresupuesto() {

        try {

            setCargando(true);
            setError("");

            const response = await fetch(
                `${API}/presupuestos-admin/${id}`
            );

            const datos = await response.json();

            if (!response.ok || !datos.ok) {
                throw new Error(
                    datos.mensaje ||
                    "No se pudo cargar el ticket."
                );
            }

            setPresupuesto(datos.presupuesto);

            setNotaAdmin(
                datos.presupuesto.nota_admin || ""
            );

            setSeguimiento(
                convertirParaInput(
                    datos.presupuesto.proximo_seguimiento
                )
            );

            setCompletarSeguimientoAlContactar(
                Boolean(
                    datos.presupuesto.proximo_seguimiento
                )
            );

        } catch (err) {

            console.error(
                "Error cargando ticket:",
                err
            );

            setError(
                err.message ||
                "No se pudo cargar el ticket."
            );

        } finally {

            setCargando(false);

        }
    }


    async function cargarHistorial() {

        try {

            const response = await fetch(
                `${API}/presupuestos-admin/${id}/historial`
            );

            const datos = await response.json();

            if (!response.ok || !datos.ok) {
                return;
            }

            setHistorial(
                datos.historial || []
            );

        } catch (err) {

            console.error(
                "Error cargando historial:",
                err
            );
        }
    }


    async function cargarContactos() {

        try {

            const response = await fetch(
                `${API}/presupuestos-admin/${id}/contactos`
            );

            const datos = await response.json();

            if (!response.ok || !datos.ok) {
                return;
            }

            setContactos(
                datos.contactos || []
            );

        } catch (err) {

            console.error(
                "Error cargando contactos:",
                err
            );
        }
    }


    async function cargarSeguimientosHistorial() {

        try {

            const response = await fetch(
                `${API}/presupuestos-admin/${id}/seguimientos`
            );

            const datos = await response.json();

            if (!response.ok || !datos.ok) {
                return;
            }

            setSeguimientosHistorial(
                datos.seguimientos || []
            );

        } catch (err) {

            console.error(
                "Error cargando seguimientos:",
                err
            );
        }
    }


    useEffect(() => {

        cargarPresupuesto();
        cargarHistorial();
        cargarContactos();
        cargarSeguimientosHistorial();

    }, [id]);


    function obtenerNombreAdmin() {

        let nombreAdmin = "Administrador";

        try {

            const adminGuardado =
                localStorage.getItem(
                    "administrador"
                );

            if (adminGuardado) {

                const admin =
                    JSON.parse(adminGuardado);

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


    function limpiarTelefono(telefono) {

        return String(
            telefono || ""
        ).replace(/\D/g, "");
    }


    async function registrarContacto(
        medio = "Manual",
        mostrarMensaje = true
    ) {

        try {

            setRegistrandoContacto(true);

            if (mostrarMensaje) {
                setMensajeContacto("");
            }

            const cerrarSeguimiento =
                Boolean(
                    presupuesto?.proximo_seguimiento
                ) &&
                completarSeguimientoAlContactar;

            const response = await fetch(
                `${API}/presupuestos/${id}/contacto`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        atendido_por:
                            obtenerNombreAdmin(),

                        medio,

                        cerrar_seguimiento:
                            cerrarSeguimiento
                    })
                }
            );

            const datos = await response.json();

            if (!response.ok || !datos.ok) {

                throw new Error(
                    datos.mensaje ||
                    "No se pudo registrar el contacto."
                );
            }

            setPresupuesto(
                anterior => ({
                    ...anterior,

                    atendido_por:
                        datos.atendido_por,

                    ultimo_contacto:
                        datos.ultimo_contacto,

                    estado:
                        datos.estado ||
                        anterior.estado,

                    proximo_seguimiento:
                        datos.proximo_seguimiento
                })
            );

            if (datos.seguimiento_cerrado) {

                setSeguimiento("");

                setCompletarSeguimientoAlContactar(
                    false
                );
            }

            await cargarContactos();
            await cargarSeguimientosHistorial();

            if (datos.cambio_estado) {
                await cargarHistorial();
            }

            if (mostrarMensaje) {

                setMensajeContacto(
                    datos.mensaje ||
                    "Contacto registrado correctamente."
                );
            }

            return {
                ok: true,
                datos
            };

        } catch (err) {

            console.error(
                "Error registrando contacto:",
                err
            );

            if (mostrarMensaje) {

                setMensajeContacto(
                    err.message ||
                    "No se pudo registrar el contacto."
                );
            }

            return {
                ok: false
            };

        } finally {

            setRegistrandoContacto(false);

        }
    }


    async function abrirWhatsApp() {

        const telefono =
            limpiarTelefono(
                presupuesto.telefono
            );

        if (!telefono) {

            alert(
                "Este cliente no tiene un teléfono registrado."
            );

            return;
        }

        let numero = telefono;

        if (!numero.startsWith("54")) {
            numero = `54${numero}`;
        }

        const mensaje =
            `Hola ${presupuesto.cliente || ""}, ` +
            `te contacto de RC Conversiones por tu solicitud ` +
            `${presupuesto.codigo || `#${presupuesto.id}`}.`;

        const whatsappUrl =
            `https://wa.me/${numero}?text=${encodeURIComponent(
                mensaje
            )}`;

        const ventana =
            window.open(
                "about:blank",
                "_blank"
            );

        const resultado =
            await registrarContacto(
                "WhatsApp",
                false
            );

        if (!resultado.ok) {

            if (ventana) {
                ventana.close();
            }

            const abrirIgual =
                window.confirm(
                    "No se pudo registrar el contacto en el sistema. ¿Querés abrir WhatsApp igualmente?"
                );

            if (abrirIgual) {

                window.open(
                    whatsappUrl,
                    "_blank",
                    "noopener,noreferrer"
                );
            }

            return;
        }

        if (ventana) {

            ventana.location.href =
                whatsappUrl;

        } else {

            window.open(
                whatsappUrl,
                "_blank",
                "noopener,noreferrer"
            );
        }
    }


    async function llamarCliente() {

        const telefono =
            limpiarTelefono(
                presupuesto.telefono
            );

        if (!telefono) {

            alert(
                "Este cliente no tiene un teléfono registrado."
            );

            return;
        }

        const resultado =
            await registrarContacto(
                "Llamada",
                false
            );

        if (!resultado.ok) {

            const llamarIgual =
                window.confirm(
                    "No se pudo registrar la llamada en el sistema. ¿Querés llamar igualmente?"
                );

            if (!llamarIgual) {
                return;
            }
        }

        window.location.href =
            `tel:${telefono}`;
    }


    async function cambiarEstado(
        nuevoEstado
    ) {

        if (
            presupuesto.estado ===
            nuevoEstado
        ) {
            return;
        }

        try {

            setActualizandoEstado(true);
            setMensajeEstado("");

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
                    "No se pudo cambiar el estado."
                );
            }

            await cargarPresupuesto();
            await cargarHistorial();
            await cargarContactos();
            await cargarSeguimientosHistorial();

            setMensajeEstado(
                datos.mensaje ||
                "Estado actualizado correctamente."
            );

        } catch (err) {

            setMensajeEstado(
                err.message ||
                "No se pudo cambiar el estado."
            );

        } finally {

            setActualizandoEstado(false);

        }
    }


    async function guardarNotaInterna() {

        try {

            setGuardandoNota(true);
            setMensajeNota("");

            const response = await fetch(
                `${API}/presupuestos/${id}/nota`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        nota_admin:
                            notaAdmin
                    })
                }
            );

            const datos =
                await response.json();

            if (!response.ok || !datos.ok) {

                throw new Error(
                    datos.mensaje ||
                    "No se pudo guardar la nota."
                );
            }

            setPresupuesto(
                anterior => ({
                    ...anterior,
                    nota_admin:
                        notaAdmin
                })
            );

            setMensajeNota(
                "Nota guardada correctamente."
            );

        } catch (err) {

            setMensajeNota(
                err.message ||
                "No se pudo guardar la nota."
            );

        } finally {

            setGuardandoNota(false);

        }
    }


    async function guardarSeguimiento() {

        if (!seguimiento) {

            setMensajeSeguimiento(
                "Elegí una fecha y hora."
            );

            return;
        }

        try {

            setGuardandoSeguimiento(true);
            setMensajeSeguimiento("");

            const response = await fetch(
                `${API}/presupuestos/${id}/seguimiento`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        proximo_seguimiento:
                            seguimiento,

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
                    "No se pudo guardar el seguimiento."
                );
            }

            setPresupuesto(
                anterior => ({
                    ...anterior,

                    proximo_seguimiento:
                        datos.proximo_seguimiento
                })
            );

            setSeguimiento(
                convertirParaInput(
                    datos.proximo_seguimiento
                )
            );

            setCompletarSeguimientoAlContactar(
                true
            );

            await cargarSeguimientosHistorial();

            setMensajeSeguimiento(
                datos.mensaje ||
                "Seguimiento guardado correctamente."
            );

        } catch (err) {

            setMensajeSeguimiento(
                err.message ||
                "No se pudo guardar el seguimiento."
            );

        } finally {

            setGuardandoSeguimiento(false);

        }
    }


    async function quitarSeguimiento() {

        try {

            setGuardandoSeguimiento(true);
            setMensajeSeguimiento("");

            const response = await fetch(
                `${API}/presupuestos/${id}/seguimiento`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        proximo_seguimiento:
                            null,

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
                    "No se pudo quitar el seguimiento."
                );
            }

            setSeguimiento("");

            setCompletarSeguimientoAlContactar(
                false
            );

            setPresupuesto(
                anterior => ({
                    ...anterior,
                    proximo_seguimiento:
                        null
                })
            );

            await cargarSeguimientosHistorial();

            setMensajeSeguimiento(
                datos.mensaje ||
                "Seguimiento cancelado correctamente."
            );

        } catch (err) {

            setMensajeSeguimiento(
                err.message ||
                "No se pudo quitar el seguimiento."
            );

        } finally {

            setGuardandoSeguimiento(false);

        }
    }


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


    function seguimientoVencido() {

        if (
            !presupuesto?.proximo_seguimiento
        ) {
            return false;
        }

        const fecha =
            new Date(
                presupuesto.proximo_seguimiento
            );

        return (
            !Number.isNaN(
                fecha.getTime()
            ) &&
            fecha.getTime() <
                Date.now()
        );
    }


    function iconoMedio(medio) {

        if (medio === "WhatsApp") {
            return "💬";
        }

        if (medio === "Llamada") {
            return "📞";
        }

        return "📝";
    }


    function iconoSeguimiento(
        estadoSeguimiento
    ) {

        if (
            estadoSeguimiento ===
            "Completado"
        ) {
            return "✅";
        }

        if (
            estadoSeguimiento ===
            "Cancelado"
        ) {
            return "❌";
        }

        return "📅";
    }


    function claseSeguimiento(
        estadoSeguimiento
    ) {

        if (
            estadoSeguimiento ===
            "Completado"
        ) {
            return "completado";
        }

        if (
            estadoSeguimiento ===
            "Cancelado"
        ) {
            return "cancelado";
        }

        return "programado";
    }


    if (cargando) {

        return (
            <section className="adminPresupuestoDetalle">

                <p>
                    Cargando ticket...
                </p>

            </section>
        );
    }


    if (
        error ||
        !presupuesto
    ) {

        return (
            <section className="adminPresupuestoDetalle">

                <button
                    className="volverPresupuestos"
                    onClick={() =>
                        navigate(
                            "/admin/presupuestos"
                        )
                    }
                    type="button"
                >
                    ← Volver a tickets
                </button>

                <div className="detallePresupuestoError">
                    {error ||
                        "Ticket no encontrado."}
                </div>

            </section>
        );
    }


    const productos =
        obtenerProductos(
            presupuesto.productos
        );

    const estado =
        presupuesto.estado ||
        "Pendiente";

    const estaVencido =
        seguimientoVencido();

    const ticketFinalizado =
        estado === "Aprobado" ||
        estado === "Rechazado";


    return (
        <section className="adminPresupuestoDetalle">


            {/* VOLVER */}

            <button
                className="volverPresupuestos"
                onClick={() =>
                    navigate(
                        "/admin/presupuestos"
                    )
                }
                type="button"
            >
                ← Volver a tickets
            </button>


            {/* HEADER */}

            <div className="detallePresupuestoHeader">

                <div>

                    <span className="detalleCodigo">
                        {presupuesto.codigo}
                    </span>

                    <h1>
                        Ticket #{presupuesto.id}
                    </h1>

                    <p>
                        Detalle completo de la solicitud.
                    </p>

                    <div className="detalleFecha">

                        <span>
                            Fecha de creación
                        </span>

                        <strong>
                            {formatearFecha(
                                presupuesto.fecha
                            )}
                        </strong>

                    </div>

                </div>

                <span
                    className={
                        `detalleEstado ${
                            estado
                                .toLowerCase()
                                .replace(/\s+/g, "-")
                        }`
                    }
                >
                    {estado}
                </span>

            </div>


            {/* CONTACTO RÁPIDO */}

            <div className="contactoClienteBox">

                <div className="contactoClienteInfo">

                    <span>
                        Contacto del cliente
                    </span>

                    <strong>
                        {presupuesto.telefono ||
                            "Sin teléfono"}
                    </strong>

                </div>

                <div className="contactoClienteAcciones">

                    <button
                        type="button"
                        className="btnWhatsappAdmin"
                        onClick={
                            abrirWhatsApp
                        }
                        disabled={
                            registrandoContacto
                        }
                    >
                        💬 Abrir WhatsApp
                    </button>

                    <button
                        type="button"
                        className="btnLlamarAdmin"
                        onClick={
                            llamarCliente
                        }
                        disabled={
                            registrandoContacto
                        }
                    >
                        📞 Llamar
                    </button>

                </div>

            </div>


            {/* ÚLTIMO CONTACTO */}

            <div className="registroContactoBox">

                <div className="registroContactoDatos">

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

                </div>


                {!ticketFinalizado &&
                presupuesto.proximo_seguimiento && (

                    <label className="completarSeguimientoContacto">

                        <input
                            type="checkbox"
                            checked={
                                completarSeguimientoAlContactar
                            }
                            onChange={(e) =>
                                setCompletarSeguimientoAlContactar(
                                    e.target.checked
                                )
                            }
                        />

                        <span>

                            <strong>
                                Completar seguimiento actual
                            </strong>

                            <small>

                                Al registrar este contacto,
                                se completará el seguimiento
                                programado para{" "}

                                {formatearFecha(
                                    presupuesto.proximo_seguimiento
                                )}.

                            </small>

                        </span>

                    </label>

                )}


                <button
                    type="button"
                    className="registrarContactoBtn"
                    onClick={() =>
                        registrarContacto(
                            "Manual",
                            true
                        )
                    }
                    disabled={
                        registrandoContacto
                    }
                >
                    {registrandoContacto
                        ? "Registrando..."
                        : "Registrar contacto manual"
                    }
                </button>

                {mensajeContacto && (

                    <p className="mensajeContacto">
                        {mensajeContacto}
                    </p>

                )}

            </div>


            {/* SEGUIMIENTO */}

            {ticketFinalizado ? (

                <div className="seguimientoFinalizadoBox">

                    <div className="seguimientoFinalizadoIcono">
                        ✓
                    </div>

                    <div>

                        <h2>
                            Ticket finalizado
                        </h2>

                        <p>
                            Este ticket está{" "}
                            <strong>
                                {estado}
                            </strong>{" "}
                            y no requiere nuevos seguimientos.
                        </p>

                    </div>

                </div>

            ) : (

                <div
                    className={
                        `seguimientoBox ${
                            estaVencido
                                ? "seguimientoVencido"
                                : ""
                        }`
                    }
                >

                    <div className="seguimientoHeader">

                        <div>

                            <h2>
                                Próximo seguimiento
                            </h2>

                            <p>
                                Programá cuándo volver a contactar
                                a este cliente.
                            </p>

                        </div>

                        {presupuesto.proximo_seguimiento && (

                            <span
                                className={
                                    estaVencido
                                        ? "seguimientoBadge vencido"
                                        : "seguimientoBadge"
                                }
                            >
                                {estaVencido
                                    ? "Vencido"
                                    : "Programado"
                                }
                            </span>

                        )}

                    </div>


                    {presupuesto.proximo_seguimiento && (

                        <div className="seguimientoActual">

                            <span>
                                Seguimiento programado
                            </span>

                            <strong>
                                {formatearFecha(
                                    presupuesto.proximo_seguimiento
                                )}
                            </strong>

                        </div>

                    )}


                    {estaVencido && (

                        <div className="seguimientoAlerta">

                            <strong>
                                ⚠ Seguimiento vencido
                            </strong>

                            <span>
                                La fecha programada ya pasó.
                                Este cliente requiere atención.
                            </span>

                        </div>

                    )}


                    <div className="seguimientoFormulario">

                        <label>
                            Fecha y hora
                        </label>

                        <input
                            type="datetime-local"
                            value={
                                seguimiento
                            }
                            onChange={(e) => {

                                setSeguimiento(
                                    e.target.value
                                );

                                setMensajeSeguimiento("");

                            }}
                        />

                    </div>


                    <div className="seguimientoAcciones">

                        <button
                            type="button"
                            className="guardarSeguimientoBtn"
                            onClick={
                                guardarSeguimiento
                            }
                            disabled={
                                guardandoSeguimiento
                            }
                        >
                            {guardandoSeguimiento
                                ? "Guardando..."
                                : presupuesto.proximo_seguimiento
                                    ? "Reprogramar seguimiento"
                                    : "Guardar seguimiento"
                            }
                        </button>


                        {presupuesto.proximo_seguimiento && (

                            <button
                                type="button"
                                className="quitarSeguimientoBtn"
                                onClick={
                                    quitarSeguimiento
                                }
                                disabled={
                                    guardandoSeguimiento
                                }
                            >
                                Cancelar seguimiento
                            </button>

                        )}

                    </div>


                    {mensajeSeguimiento && (

                        <p className="mensajeSeguimiento">
                            {mensajeSeguimiento}
                        </p>

                    )}

                </div>

            )}


            {/* HISTORIAL DE SEGUIMIENTOS */}

            <div className="historialSeguimientosBox">

                <div className="historialSeguimientosHeader">

                    <div>

                        <h2>
                            Historial de seguimientos
                        </h2>

                        <p>
                            Seguimientos programados,
                            completados y cancelados.
                        </p>

                    </div>

                    <span className="cantidadSeguimientos">

                        {seguimientosHistorial.length} seguimiento
                        {seguimientosHistorial.length !== 1
                            ? "s"
                            : ""}

                    </span>

                </div>


                {seguimientosHistorial.length === 0 ? (

                    <div className="seguimientosVacios">

                        Todavía no hay seguimientos registrados.

                    </div>

                ) : (

                    <div className="listaHistorialSeguimientos">

                        {seguimientosHistorial.map(
                            item => (

                                <div
                                    key={item.id}
                                    className={
                                        `historialSeguimientoItem ${
                                            claseSeguimiento(
                                                item.estado
                                            )
                                        }`
                                    }
                                >

                                    <div className="seguimientoHistorialIcono">

                                        {iconoSeguimiento(
                                            item.estado
                                        )}

                                    </div>


                                    <div className="seguimientoHistorialInfo">

                                        <div className="seguimientoHistorialTop">

                                            <strong>
                                                {item.estado}
                                            </strong>

                                            <span>

                                                Creado{" "}

                                                {formatearFecha(
                                                    item.fecha_creacion
                                                )}

                                            </span>

                                        </div>


                                        <div className="seguimientoHistorialDatos">

                                            <div>

                                                <span>
                                                    Programado para
                                                </span>

                                                <strong>
                                                    {formatearFecha(
                                                        item.fecha_programada
                                                    )}
                                                </strong>

                                            </div>


                                            {item.motivo_cierre && (

                                                <div>

                                                    <span>
                                                        Motivo
                                                    </span>

                                                    <strong>
                                                        {item.motivo_cierre}
                                                    </strong>

                                                </div>

                                            )}


                                            {item.fecha_cierre && (

                                                <div>

                                                    <span>
                                                        {item.estado ===
                                                        "Completado"
                                                            ? "Completado"
                                                            : "Cerrado"
                                                        }
                                                    </span>

                                                    <strong>
                                                        {formatearFecha(
                                                            item.fecha_cierre
                                                        )}
                                                    </strong>

                                                </div>

                                            )}


                                            {item.atendido_por && (

                                                <div>

                                                    <span>
                                                        Administrador
                                                    </span>

                                                    <strong>
                                                        {item.atendido_por}
                                                    </strong>

                                                </div>

                                            )}

                                        </div>

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                )}

            </div>


            {/* HISTORIAL CONTACTOS */}

            <div className="historialContactosBox">

                <div className="historialContactosHeader">

                    <div>

                        <h2>
                            Historial de contactos
                        </h2>

                        <p>
                            Registro de comunicaciones
                            realizadas con el cliente.
                        </p>

                    </div>

                    <span className="cantidadContactos">

                        {contactos.length} contacto
                        {contactos.length !== 1
                            ? "s"
                            : ""}

                    </span>

                </div>


                {contactos.length === 0 ? (

                    <div className="contactosVacios">

                        Todavía no hay contactos registrados.

                    </div>

                ) : (

                    <div className="listaHistorialContactos">

                        {contactos.map(
                            contacto => (

                                <div
                                    className="historialContactoItem"
                                    key={
                                        contacto.id
                                    }
                                >

                                    <div className="contactoMedioIcono">

                                        {iconoMedio(
                                            contacto.medio
                                        )}

                                    </div>

                                    <div className="contactoHistorialInfo">

                                        <div className="contactoHistorialTop">

                                            <strong>
                                                {contacto.medio}
                                            </strong>

                                            <span>
                                                {formatearFecha(
                                                    contacto.fecha
                                                )}
                                            </span>

                                        </div>

                                        <small>

                                            Atendido por{" "}

                                            <strong>
                                                {contacto.atendido_por ||
                                                    "Administrador"}
                                            </strong>

                                        </small>

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                )}

            </div>


            {/* ESTADO */}

            <div className="cambiarEstadoBox">

                <div>

                    <h2>
                        Estado de la solicitud
                    </h2>

                    <p>
                        Actualizá el estado para realizar
                        el seguimiento del ticket.
                    </p>

                </div>

                <div className="estadoBotones">

                    {ESTADOS.map(
                        estadoDisponible => (

                            <button
                                key={
                                    estadoDisponible
                                }
                                type="button"
                                disabled={
                                    actualizandoEstado ||
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
                                        estadoDisponible
                                    )
                                }
                            >
                                {estadoDisponible}
                            </button>

                        )
                    )}

                </div>

                {mensajeEstado && (

                    <p className="mensajeEstado">
                        {mensajeEstado}
                    </p>

                )}

            </div>


            {/* HISTORIAL ESTADOS */}

            <div className="historialTicket">

                <div className="historialHeader">

                    <div>

                        <h2>
                            Historial de estados
                        </h2>

                        <p>
                            Seguimiento de cambios
                            realizados en la solicitud.
                        </p>

                    </div>

                </div>


                {historial.length === 0 ? (

                    <div className="historialVacio">

                        Todavía no hay movimientos registrados.

                    </div>

                ) : (

                    <div className="historialTimeline">

                        {historial.map(
                            (item, index) => (

                                <div
                                    className="historialItem"
                                    key={
                                        item.id ||
                                        index
                                    }
                                >

                                    <div className="historialPunto">
                                        {index + 1}
                                    </div>

                                    <div className="historialContenido">

                                        <strong>
                                            {item.estado}
                                        </strong>

                                        <span>
                                            {formatearFecha(
                                                item.fecha
                                            )}
                                        </span>

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                )}

            </div>


            {/* CLIENTE */}

            <div className="detalleCliente">

                <h2>
                    Datos del cliente
                </h2>

                <div className="detalleClienteGrid">

                    <div>

                        <span>
                            Nombre
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


                    {presupuesto.cliente_id && (

                        <div>

                            <span>
                                Cuenta del cliente
                            </span>

                            <button
                                className="verFichaCliente"
                                onClick={() =>
                                    navigate(
                                        `/admin/clientes/${presupuesto.cliente_id}`
                                    )
                                }
                                type="button"
                            >
                                Ver ficha del cliente
                            </button>

                        </div>

                    )}

                </div>

            </div>


            {/* NOTA */}

            <div className="notaAdminBox">

                <div className="notaAdminHeader">

                    <div>

                        <h2>
                            Nota interna
                        </h2>

                        <p>
                            Esta nota solo puede verla
                            administración.
                        </p>

                    </div>

                    <span className="notaPrivadaBadge">
                        Privada
                    </span>

                </div>

                <textarea
                    value={
                        notaAdmin
                    }
                    onChange={(e) => {

                        setNotaAdmin(
                            e.target.value
                        );

                        setMensajeNota("");

                    }}
                    placeholder="Escribí una nota interna sobre este ticket..."
                    rows={5}
                />

                <div className="notaAdminFooter">

                    <span>
                        {notaAdmin.length} caracteres
                    </span>

                    <button
                        type="button"
                        onClick={
                            guardarNotaInterna
                        }
                        disabled={
                            guardandoNota
                        }
                    >
                        {guardandoNota
                            ? "Guardando..."
                            : "Guardar nota"
                        }
                    </button>

                </div>

                {mensajeNota && (

                    <p className="mensajeNota">
                        {mensajeNota}
                    </p>

                )}

            </div>


            {/* PRODUCTOS */}

            <div className="detalleProductos">

                <h2>
                    Productos solicitados
                </h2>

                <div className="productosDetalle">

                    {productos.map(
                        (producto, index) => {

                            const precio =
                                Number(
                                    producto.precio ||
                                    0
                                );

                            const cantidad =
                                Number(
                                    producto.cantidad ||
                                    0
                                );

                            const subtotal =
                                precio * cantidad;

                            const imagen =
                                producto.imagen
                                    ? (
                                        producto.imagen.startsWith(
                                            "http"
                                        )
                                            ? producto.imagen
                                            : `${API}${producto.imagen}`
                                    )
                                    : null;

                            return (

                                <div
                                    className="productoDetalle"
                                    key={
                                        producto.id ||
                                        index
                                    }
                                >

                                    <div className="productoDetalleInfo">

                                        {imagen && (

                                            <img
                                                src={imagen}
                                                alt={
                                                    producto.nombre ||
                                                    "Producto"
                                                }
                                            />

                                        )}

                                        <div>

                                            <strong>
                                                {producto.nombre ||
                                                    "Producto"}
                                            </strong>

                                            <span>

                                                Precio unitario: $

                                                {precio.toLocaleString(
                                                    "es-AR"
                                                )}

                                            </span>

                                        </div>

                                    </div>

                                    <div className="productoCantidad">
                                        x{cantidad}
                                    </div>

                                    <strong className="productoSubtotal">

                                        $

                                        {subtotal.toLocaleString(
                                            "es-AR"
                                        )}

                                    </strong>

                                </div>

                            );

                        }
                    )}

                </div>

            </div>


            {/* TOTAL */}

            <div className="detalleTotal">

                <span>
                    Total del presupuesto
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

        </section>
    );
}