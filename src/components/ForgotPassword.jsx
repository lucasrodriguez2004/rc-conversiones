import { Link } from "react-router-dom";
import { useState } from "react";
import "../styles/Login.css";
import "../styles/PasswordRecovery.css";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function enviar(event) {
    event.preventDefault();
    if (cargando) return;
    const correo = email.trim().toLowerCase();
    if (!correo) {
      setMensaje("Ingresá tu correo electrónico.");
      return;
    }

    try {
      setCargando(true);
      setMensaje("");
      const response = await fetch(`${API}/clientes/password/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: correo })
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.mensaje || "No se pudo procesar la solicitud.");
      setEnviado(true);
      setMensaje(data.mensaje || "Si existe una cuenta con ese correo, te enviamos las instrucciones.");
    } catch (error) {
      setMensaje(error.message || "No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="loginPage recoveryPage">
      <div className="loginCard recoveryCard">
        <div className="recoveryIcon">🔐</div>
        <h1>Recuperar contraseña</h1>
        <p className="loginSubtitle">Ingresá el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.</p>
        <form onSubmit={enviar} autoComplete="on">
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            disabled={cargando || enviado}
          />
          {mensaje && <div className={enviado ? "recoveryMessage success" : "recoveryMessage"}>{mensaje}</div>}
          {!enviado && (
            <button type="submit" className="loginButton" disabled={cargando}>
              {cargando ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>
          )}
        </form>
        <Link className="recoveryBack" to="/login">← Volver a iniciar sesión</Link>
      </div>
    </section>
  );
}
