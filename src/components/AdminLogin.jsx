import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/AdminLogin.css";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export default function AdminLogin() {

    const navigate = useNavigate();

    const [usuario, setUsuario] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [mensaje, setMensaje] =
        useState("");

    const [cargando, setCargando] =
        useState(false);


    async function ingresar(e) {

        e.preventDefault();

        if (cargando) {
            return;
        }

        setMensaje("");

        const usuarioLimpio =
            usuario.trim();

        if (
            !usuarioLimpio ||
            !password
        ) {
            setMensaje(
                "Completá usuario y contraseña."
            );
            return;
        }

        try {

            setCargando(true);

            const response = await fetch(
                `${API}/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        usuario:
                            usuarioLimpio,
                        password
                    })
                }
            );

            let datos;

            try {
                datos =
                    await response.json();
            } catch {
                throw new Error(
                    "El servidor devolvió una respuesta no válida."
                );
            }

            if (
                !response.ok ||
                !datos?.ok
            ) {
                setMensaje(
                    datos?.mensaje ||
                    "Usuario o contraseña incorrectos."
                );
                return;
            }

            if (
                !datos.token ||
                !datos.administrador
            ) {
                setMensaje(
                    "No se pudo crear una sesión segura."
                );
                return;
            }

            localStorage.setItem(
                "admin_token",
                datos.token
            );

            localStorage.setItem(
                "administrador",
                JSON.stringify(
                    datos.administrador
                )
            );

            navigate(
                "/admin/presupuestos",
                {
                    replace: true
                }
            );

        } catch (error) {

            console.error(
                "Error iniciando sesión:",
                error
            );

            setMensaje(
                error.message ||
                "No se pudo conectar con el servidor."
            );

        } finally {
            setCargando(false);
        }
    }


    return (

        <section className="adminLoginPage">

            <div className="adminLoginCard">

                <h1>
                    Panel de administración
                </h1>

                <p>
                    Ingresá con tu cuenta de administrador.
                </p>

                <form
                    onSubmit={ingresar}
                    autoComplete="on"
                >

                    <input
                        type="text"
                        name="usuario"
                        placeholder="Usuario"
                        value={usuario}
                        onChange={(e) =>
                            setUsuario(
                                e.target.value
                            )
                        }
                        autoComplete="username"
                        disabled={cargando}
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) =>
                            setPassword(
                                e.target.value
                            )
                        }
                        autoComplete="current-password"
                        disabled={cargando}
                    />

                    {mensaje && (
                        <div
                            className="adminLoginError"
                            role="alert"
                        >
                            {mensaje}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={cargando}
                    >
                        {cargando
                            ? "Ingresando..."
                            : "Ingresar"
                        }
                    </button>

                </form>

            </div>

        </section>
    );
}
