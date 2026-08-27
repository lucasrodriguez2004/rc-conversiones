import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import "../styles/MiCuenta.css";
import "../styles/TicketConfirmacion.css";

const API_RAW = String(
  import.meta.env.VITE_API_URL || "http://localhost:5000"
);
const API = API_RAW.endsWith("/")
  ? API_RAW.slice(0, -1)
  : API_RAW;


// RC_FETCH_CON_SESION_V3
function fetchConSesion(url, options = {}) {
  const token = localStorage.getItem("cliente_token");

  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers
  });
}

export default function MiCuenta() {
  const navigate = useNavigate();
  const location = useLocation();

  const [cliente, setCliente] = useState(null);
  const [presupuestos, setPresupuestos] = useState([]);
  const [historiales, setHistoriales] = useState({});
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [mensajePassword, setMensajePassword] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    actual: "",
    nueva: "",
    confirmar: ""
  });
  const [mensaje, setMensaje] = useState(null);
  const [ticketAbierto, setTicketAbierto] = useState(null);
  const [confirmacionTicket, setConfirmacionTicket] = useState(null);

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: ""
  });

  useEffect(() => {
    let confirmacion = location.state?.ticketGenerado || null;

    if (!confirmacion) {
      const guardada = localStorage.getItem("ticket_recien_generado");

      if (guardada) {
        try {
          confirmacion = JSON.parse(guardada);
        } catch {
          localStorage.removeItem("ticket_recien_generado");
        }
      }
    }

    if (confirmacion?.codigo) {
      setConfirmacionTicket(confirmacion);
    }
  }, [location.state]);

  useEffect(() => {
    let activo = true;
    let intervalo = null;

    async function iniciar() {
      const token = localStorage.getItem("cliente_token");

      if (!token) {
        localStorage.removeItem("cliente");
        navigate("/login", { replace: true });
        return;
      }

      try {
        setCargando(true);

        const response = await fetchConSesion(`${API}/clientes/perfil`);
        const data = await response.json();

        if (!response.ok || !data.ok || !data.cliente) {
          throw new Error(data.mensaje || "No se pudo validar la sesión.");
        }

        if (!activo) return;

        actualizarClienteLocal(data.cliente);
        await cargarPresupuestos(data.cliente.id);

        if (!activo) return;

        intervalo = setInterval(() => {
          cargarPresupuestos(data.cliente.id, false);
        }, 15000);
      } catch (error) {
        console.error("Error cargando Mi cuenta:", error);

        if (!activo) return;

        localStorage.removeItem("cliente_token");
        localStorage.removeItem("cliente");
        navigate("/login", { replace: true });
      } finally {
        if (activo) setCargando(false);
      }
    }

    iniciar();

    return () => {
      activo = false;
      if (intervalo) clearInterval(intervalo);
    };
  }, [navigate]);

  function actualizarClienteLocal(nuevoCliente) {
    setCliente(nuevoCliente);
    setForm({
      nombre: nuevoCliente?.nombre || "",
      email: nuevoCliente?.email || "",
      telefono: nuevoCliente?.telefono || ""
    });

    localStorage.setItem(
      "cliente",
      JSON.stringify(nuevoCliente)
    );
  }

  async function cargarPresupuestos(clienteId, mostrarCarga = true) {
    try {
      if (mostrarCarga) setCargando(true);

      const response = await fetchConSesion(
        `${API}/presupuestos/cliente/${clienteId}`
      );
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.mensaje || "No se pudieron obtener las solicitudes."
        );
      }

      const lista = Array.isArray(data.presupuestos)
        ? data.presupuestos
        : [];

      setPresupuestos(lista);
      await cargarHistoriales(lista, clienteId);
    } catch (error) {
      console.error("Error cargando tickets:", error);
    } finally {
      if (mostrarCarga) setCargando(false);
    }
  }

  async function cargarHistoriales(lista, clienteId) {
    const resultados = {};

    await Promise.all(
      lista.map(async (presupuesto) => {
        try {
          const response = await fetchConSesion(
            `${API}/presupuestos/cliente/${clienteId}/${presupuesto.id}/historial`
          );
          const data = await response.json();

          resultados[presupuesto.id] =
            response.ok && data.ok && Array.isArray(data.historial)
              ? data.historial
              : [];
        } catch {
          resultados[presupuesto.id] = [];
        }
      })
    );

    setHistoriales(resultados);
  }

  function editar() {
    setMensaje(null);
    setForm({
      nombre: cliente?.nombre || "",
      email: cliente?.email || "",
      telefono: cliente?.telefono || ""
    });
    setEditando(true);
  }

  function cancelarEdicion() {
    setMensaje(null);
    setEditando(false);
    setForm({
      nombre: cliente?.nombre || "",
      email: cliente?.email || "",
      telefono: cliente?.telefono || ""
    });
  }

  function cambiarCampo(event) {
    const { name, value } = event.target;
    setForm((actual) => ({
      ...actual,
      [name]: value
    }));
  }

  async function guardarDatos(event) {
    event.preventDefault();
    setMensaje(null);

    const payload = {
      nombre: form.nombre.trim(),
      email: form.email.trim().toLowerCase(),
      telefono: form.telefono.trim()
    };

    if (!payload.nombre || !payload.email || !payload.telefono) {
      setMensaje({
        tipo: "error",
        texto: "Completá nombre, correo y teléfono."
      });
      return;
    }

    try {
      setGuardando(true);

      const response = await fetchConSesion(
        `${API}/clientes/perfil`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.mensaje || "No se pudieron guardar los cambios."
        );
      }

      if (data.token) {
        localStorage.setItem("cliente_token", data.token);
      }

      actualizarClienteLocal(data.cliente);
      setEditando(false);

      setMensaje({
        tipo: "exito",
        texto:
          data.mensaje ||
          "Tus datos se actualizaron correctamente."
      });
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto:
          error.message ||
          "No se pudieron guardar los cambios."
      });
    } finally {
      setGuardando(false);
    }
  }

  function abrirCambioPassword() {
    setMensajePassword(null);
    setPasswordForm({
      actual: "",
      nueva: "",
      confirmar: ""
    });
    setCambiandoPassword(true);
  }

  function cancelarCambioPassword() {
    setMensajePassword(null);
    setPasswordForm({
      actual: "",
      nueva: "",
      confirmar: ""
    });
    setCambiandoPassword(false);
  }

  function cambiarPasswordCampo(event) {
    const { name, value } = event.target;

    setPasswordForm((actual) => ({
      ...actual,
      [name]: value
    }));
  }

  async function guardarPassword(event) {
    event.preventDefault();
    setMensajePassword(null);

    if (!passwordForm.actual) {
      setMensajePassword({
        tipo: "error",
        texto: "Ingresá tu contraseña actual."
      });
      return;
    }

    if (passwordForm.nueva.length < 8) {
      setMensajePassword({
        tipo: "error",
        texto: "La nueva contraseña debe tener al menos 8 caracteres."
      });
      return;
    }

    if (passwordForm.nueva.length > 128) {
      setMensajePassword({
        tipo: "error",
        texto: "La nueva contraseña es demasiado larga."
      });
      return;
    }

    if (passwordForm.nueva === passwordForm.actual) {
      setMensajePassword({
        tipo: "error",
        texto: "La nueva contraseña debe ser diferente de la actual."
      });
      return;
    }

    if (passwordForm.nueva !== passwordForm.confirmar) {
      setMensajePassword({
        tipo: "error",
        texto: "Las nuevas contraseñas no coinciden."
      });
      return;
    }

    try {
      setGuardandoPassword(true);

      // 1) Reautenticación segura.
      // Esta ruta valida la contraseña con la MISMA lógica que el login.
      const reauthResponse = await fetchConSesion(
        `${API}/clientes/perfil/password/reauth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: cliente.email,
            password: passwordForm.actual
          })
        }
      );

      const reauthData = await reauthResponse.json();

      if (!reauthResponse.ok || !reauthData.ok || !reauthData.reauthToken) {
        throw new Error(
          reauthData.mensaje ||
          "La contraseña actual no es correcta."
        );
      }

      // 2) Cambio de contraseña usando token de un solo propósito.
      const response = await fetchConSesion(
        `${API}/clientes/perfil/password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            passwordNueva: passwordForm.nueva,
            reauthToken: reauthData.reauthToken
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.mensaje ||
          "No se pudo cambiar la contraseña."
        );
      }

      setMensajePassword({
        tipo: "exito",
        texto:
          data.mensaje ||
          "Tu contraseña fue actualizada correctamente."
      });

      setPasswordForm({
        actual: "",
        nueva: "",
        confirmar: ""
      });

      setCambiandoPassword(false);
    } catch (error) {
      setMensajePassword({
        tipo: "error",
        texto:
          error.message ||
          "No se pudo cambiar la contraseña."
      });
    } finally {
      setGuardandoPassword(false);
    }
  }

  function cerrarSesion() {
    localStorage.removeItem("cliente_token");
    localStorage.removeItem("cliente");
    localStorage.removeItem("ticket_recien_generado");
    navigate("/login");
  }

  function cerrarConfirmacionTicket() {
    setConfirmacionTicket(null);
    localStorage.removeItem("ticket_recien_generado");

    navigate(location.pathname, {
      replace: true,
      state: null
    });
  }

  function formatearFecha(fecha) {
    if (!fecha) return "Sin fecha";

    const date = new Date(fecha);

    if (Number.isNaN(date.getTime())) return "Sin fecha";

    return date.toLocaleString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function claseEstado(estado) {
    const valor = String(estado || "Pendiente").toLowerCase();

    if (valor.includes("aprob")) return "estadoAprobado";
    if (valor.includes("rechaz")) return "estadoRechazado";
    if (valor.includes("revisi")) return "estadoRevision";
    if (valor.includes("contact")) return "estadoContactado";

    return "estadoPendiente";
  }

  function obtenerProductos(productos) {
    if (Array.isArray(productos)) return productos;
    if (!productos) return [];

    try {
      const parsed = JSON.parse(productos);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  const iniciales = useMemo(() => {
    const partes = String(cliente?.nombre || "RC")
      .trim()
      .split(/\\s+/)
      .filter(Boolean)
      .slice(0, 2);

    return partes.map((p) => p.charAt(0).toUpperCase()).join("") || "RC";
  }, [cliente?.nombre]);

  const resumen = useMemo(() => {
    const total = presupuestos.length;
    const pendientes = presupuestos.filter((p) =>
      ["pendiente", "en revisión", "contactado"].includes(
        String(p.estado || "Pendiente").toLowerCase()
      )
    ).length;

    const finalizados = total - pendientes;

    return { total, pendientes, finalizados };
  }, [presupuestos]);

  if (!cliente) {
    return (
      <main className="miCuentaPage">
        <div className="cuentaCargando">
          <div className="cuentaSpinner" />
          <span>Cargando tu cuenta...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="miCuentaPage">
      <div className="miCuentaContainer">
        <header className="cuentaHero">
          <div className="cuentaHeroIdentity">
            <div className="cuentaAvatar">{iniciales}</div>

            <div>
              <span className="cuentaEyebrow">ÁREA DE CLIENTES</span>
              <h1>Hola, {cliente.nombre}</h1>
              <p>
                Gestioná tus datos y seguí el estado de tus solicitudes.
              </p>
            </div>
          </div>

          <div className="cuentaHeroActions">
            <Link to="/" className="cuentaVolver">
              <span aria-hidden="true">←</span>
              Volver al inicio
            </Link>

            <button
              type="button"
              className="cuentaCerrar"
              onClick={cerrarSesion}
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {confirmacionTicket && (
          <section className="cuentaConfirmacion" role="status">
            <div className="cuentaConfirmacionIcon">✓</div>

            <div>
              <span>Solicitud recibida</span>
              <h2>Tu presupuesto fue solicitado correctamente</h2>
              <p>
                Un asesor de RC Conversiones se comunicará con vos para
                continuar con la atención.
              </p>

              <div className="cuentaConfirmacionTicket">
                Ticket: <strong>{confirmacionTicket.codigo}</strong>
              </div>
            </div>

            <button type="button" onClick={cerrarConfirmacionTicket}>
              Entendido
            </button>
          </section>
        )}

        {mensaje && (
          <div
            className={
              mensaje.tipo === "exito"
                ? "cuentaMensaje cuentaMensajeExito"
                : "cuentaMensaje cuentaMensajeError"
            }
            role="status"
          >
            {mensaje.texto}
          </div>
        )}

        <section className="cuentaStats">
          <article>
            <span>Solicitudes</span>
            <strong>{resumen.total}</strong>
            <small>Total realizadas</small>
          </article>

          <article>
            <span>En seguimiento</span>
            <strong>{resumen.pendientes}</strong>
            <small>Pendientes o en revisión</small>
          </article>

          <article>
            <span>Finalizadas</span>
            <strong>{resumen.finalizados}</strong>
            <small>Aprobadas o cerradas</small>
          </article>
        </section>

        <div className="cuentaMainGrid">
          <aside className="cuentaResumenPerfil">
            <div className="cuentaResumenAvatar">{iniciales}</div>
            <h2>{cliente.nombre}</h2>
            <p>{cliente.email}</p>

            <div className="cuentaVerificacion">
              <span>✓</span>
              Cuenta verificada
            </div>

            {cliente.email_pendiente && (
              <div className="cuentaEmailPendiente">
                <strong>Nuevo correo pendiente</strong>
                <span>{cliente.email_pendiente}</span>
                <small>
                  Revisá esa casilla para confirmar el cambio.
                </small>
              </div>
            )}

            <div className="cuentaMiembro">
              <span>Cliente desde</span>
              <strong>
                {cliente.fecha_registro
                  ? new Date(cliente.fecha_registro).toLocaleDateString(
                      "es-AR",
                      {
                        month: "long",
                        year: "numeric"
                      }
                    )
                  : "RC Conversiones"}
              </strong>
            </div>
          </aside>

          <section className="cuentaDatosPanel">
            <div className="cuentaPanelHeader">
              <div>
                <span>PERFIL</span>
                <h2>Mis datos</h2>
                <p>
                  Mantené actualizada tu información de contacto.
                </p>
              </div>

              {!editando && (
                <button
                  type="button"
                  className="cuentaEditarBtn"
                  onClick={editar}
                >
                  ✎ Editar mis datos
                </button>
              )}
            </div>

            {!editando ? (
              <div className="cuentaDatosVista">
                <div>
                  <span>Nombre y apellido</span>
                  <strong>{cliente.nombre || "-"}</strong>
                </div>

                <div>
                  <span>Correo electrónico</span>
                  <strong>{cliente.email || "-"}</strong>
                </div>

                <div>
                  <span>Teléfono</span>
                  <strong>{cliente.telefono || "-"}</strong>
                </div>

                <div>
                  <span>Estado de la cuenta</span>
                  <strong className="cuentaEstadoOk">
                    ✓ Verificada
                  </strong>
                </div>
              </div>
            ) : (
              <form className="cuentaEditarForm" onSubmit={guardarDatos}>
                <label>
                  <span>Nombre y apellido</span>
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={cambiarCampo}
                    autoComplete="name"
                    maxLength={100}
                  />
                </label>

                <label>
                  <span>Correo electrónico</span>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={cambiarCampo}
                    autoComplete="email"
                    maxLength={180}
                  />
                  <small>
                    Si cambiás el correo, te enviaremos una verificación
                    antes de reemplazar el actual.
                  </small>
                </label>

                <label>
                  <span>Teléfono</span>
                  <input
                    name="telefono"
                    value={form.telefono}
                    onChange={cambiarCampo}
                    autoComplete="tel"
                    maxLength={40}
                  />
                </label>

                <div className="cuentaFormActions">
                  <button
                    type="button"
                    className="cuentaCancelarBtn"
                    onClick={cancelarEdicion}
                    disabled={guardando}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="cuentaGuardarBtn"
                    disabled={guardando}
                  >
                    {guardando ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>

        <section className="cuentaSeguridadPanel">
          <div className="cuentaSeguridadHeader">
            <div>
              <span>SEGURIDAD</span>
              <h2>Contraseña</h2>
              <p>
                Podés cambiar tu contraseña cuando quieras. Para proteger
                tu cuenta te pediremos primero la contraseña actual.
              </p>
            </div>

            {!cambiandoPassword && (
              <button
                type="button"
                className="cuentaPasswordBtn"
                onClick={abrirCambioPassword}
              >
                Cambiar contraseña
              </button>
            )}
          </div>

          {mensajePassword && (
            <div
              className={
                mensajePassword.tipo === "exito"
                  ? "cuentaPasswordMensaje cuentaPasswordExito"
                  : "cuentaPasswordMensaje cuentaPasswordError"
              }
              role="status"
            >
              {mensajePassword.texto}
            </div>
          )}

          {!cambiandoPassword ? (
            <div className="cuentaPasswordVista">
              <div className="cuentaPasswordIcon" aria-hidden="true">
                🔒
              </div>

              <div>
                <strong>Contraseña protegida</strong>
                <span>
                  Tu contraseña nunca se muestra ni se envía en texto plano.
                </span>
              </div>
            </div>
          ) : (
            <form
              className="cuentaPasswordForm"
              onSubmit={guardarPassword}
            >
              <label>
                <span>Contraseña actual</span>
                <input
                  type="password"
                  name="actual"
                  value={passwordForm.actual}
                  onChange={cambiarPasswordCampo}
                  autoComplete="current-password"
                  placeholder="Ingresá tu contraseña actual"
                />
              </label>

              <div className="cuentaPasswordDosColumnas">
                <label>
                  <span>Nueva contraseña</span>
                  <input
                    type="password"
                    name="nueva"
                    value={passwordForm.nueva}
                    onChange={cambiarPasswordCampo}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                  />
                </label>

                <label>
                  <span>Repetir nueva contraseña</span>
                  <input
                    type="password"
                    name="confirmar"
                    value={passwordForm.confirmar}
                    onChange={cambiarPasswordCampo}
                    autoComplete="new-password"
                    placeholder="Repetí la nueva contraseña"
                  />
                </label>
              </div>

              <small className="cuentaPasswordAyuda">
                Usá al menos 8 caracteres y evitá reutilizar la contraseña
                de otra cuenta.
              </small>

              <div className="cuentaPasswordActions">
                <button
                  type="button"
                  className="cuentaCancelarBtn"
                  onClick={cancelarCambioPassword}
                  disabled={guardandoPassword}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="cuentaGuardarBtn"
                  disabled={guardandoPassword}
                >
                  {guardandoPassword
                    ? "Actualizando..."
                    : "Actualizar contraseña"}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="cuentaSolicitudesPanel">
          <div className="cuentaSolicitudesHeader">
            <div>
              <span>SOLICITUDES</span>
              <h2>Mis tickets</h2>
              <p>
                Consultá el estado y el seguimiento de tus presupuestos.
              </p>
            </div>

            <div className="cuentaCantidadTickets">
              {presupuestos.length}{" "}
              {presupuestos.length === 1 ? "ticket" : "tickets"}
            </div>
          </div>

          {cargando ? (
            <div className="cuentaEstadoVacio">
              Cargando solicitudes...
            </div>
          ) : presupuestos.length === 0 ? (
            <div className="cuentaSinTickets">
              <div className="cuentaSinTicketsIcon">⌁</div>
              <h3>Todavía no tenés solicitudes</h3>
              <p>
                Elegí productos del catálogo y armá tu próxima consulta.
              </p>
              <Link to="/">Ver productos</Link>
            </div>
          ) : (
            <div className="cuentaTicketsLista">
              {presupuestos.map((presupuesto) => {
                const estado = presupuesto.estado || "Pendiente";
                const productos = obtenerProductos(presupuesto.productos);
                const historial = historiales[presupuesto.id] || [];
                const abierto = ticketAbierto === presupuesto.id;

                return (
                  <article
                    className="cuentaTicketCard"
                    key={presupuesto.id}
                  >
                    <div className="cuentaTicketPrincipal">
                      <div className="cuentaTicketCodigo">
                        <span>Número de ticket</span>
                        <strong>{presupuesto.codigo}</strong>
                      </div>

                      <div className="cuentaTicketFecha">
                        <span>Fecha</span>
                        <strong>{formatearFecha(presupuesto.fecha)}</strong>
                      </div>

                      <div className="cuentaTicketPrecio">
                        <span>Precio</span>
                        <strong>Consultar</strong>
                      </div>

                      <span
                        className={`cuentaTicketEstado ${claseEstado(
                          estado
                        )}`}
                      >
                        {estado}
                      </span>

                      <button
                        type="button"
                        className="cuentaTicketToggle"
                        onClick={() =>
                          setTicketAbierto(abierto ? null : presupuesto.id)
                        }
                      >
                        {abierto ? "Ocultar detalle" : "Ver detalle"}
                        <span aria-hidden="true">
                          {abierto ? "↑" : "↓"}
                        </span>
                      </button>
                    </div>

                    {abierto && (
                      <div className="cuentaTicketDetalle">
                        <div className="cuentaTicketDetalleCol">
                          <h4>Productos solicitados</h4>

                          {productos.length === 0 ? (
                            <p>No hay productos registrados.</p>
                          ) : (
                            <div className="cuentaProductosTicket">
                              {productos.map((producto, index) => (
                                <div key={`${presupuesto.id}-${index}`}>
                                  <span>
                                    {producto.nombre || "Producto"}
                                  </span>
                                  <strong>
                                    x{producto.cantidad || 1}
                                  </strong>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="cuentaTicketDetalleCol">
                          <h4>Seguimiento</h4>

                          {historial.length === 0 ? (
                            <p>
                              Todavía no hay movimientos registrados.
                            </p>
                          ) : (
                            <div className="cuentaTimeline">
                              {historial.map((item, index) => (
                                <div
                                  className="cuentaTimelineItem"
                                  key={item.id || index}
                                >
                                  <i
                                    className={
                                      index === historial.length - 1
                                        ? "actual"
                                        : ""
                                    }
                                  />
                                  <div>
                                    <strong>{item.estado}</strong>
                                    <span>
                                      {formatearFecha(item.fecha)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
