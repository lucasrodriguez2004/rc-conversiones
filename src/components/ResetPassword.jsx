import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import "../styles/Login.css";
import "../styles/PasswordRecovery.css";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function guardar(event) {
    event.preventDefault();
    if (cargando) return;
    if (password.length < 8) { setMensaje("La contraseña debe tener al menos 8 caracteres."); return; }
    if (password.length > 128) { setMensaje("La contraseña es demasiado larga."); return; }
    if (password !== confirmar) { setMensaje("Las contraseñas no coinciden."); return; }

    try {
      setCargando(true);
      setMensaje("");
      const response = await fetch(`${API}/clientes/password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.mensaje || "No se pudo cambiar la contraseña.");
      setExito(true);
      setMensaje(data.mensaje || "Tu contraseña fue actualizada correctamente.");
    } catch (error) {
      setMensaje(error.message || "No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="loginPage recoveryPage">
      <div className="loginCard recoveryCard">
        <div className="recoveryIcon">🔑</div>
        <h1>Nueva contraseña</h1>
        {!exito ? (
          <>
            <p className="loginSubtitle">Elegí una contraseña nueva para tu cuenta de RC Conversiones.</p>
            <form onSubmit={guardar} autoComplete="on">
              <input type="password" placeholder="Nueva contraseña" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" disabled={cargando} />
              <input type="password" placeholder="Repetir nueva contraseña" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} autoComplete="new-password" disabled={cargando} />
              {mensaje && <div className="recoveryMessage">{mensaje}</div>}
              <button type="submit" className="loginButton" disabled={cargando}>{cargando ? "Guardando..." : "Cambiar contraseña"}</button>
            </form>
          </>
        ) : (
          <>
            <div className="recoveryMessage success">{mensaje}</div>
            <Link className="loginButton recoveryLoginButton" to="/login">Iniciar sesión</Link>
          </>
        )}
      </div>
    </section>
  );
}
