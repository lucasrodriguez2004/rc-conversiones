import { useState } from "react";
import {
    Link,
    useNavigate
} from "react-router-dom";

import "../styles/Login.css";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");


export default function Login() {

    const navigate =
        useNavigate();

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [mensaje, setMensaje] =
        useState("");

    const [cargando, setCargando] =
        useState(false);


    // ==========================================
    // INICIAR SESIÓN
    // ==========================================

    async function iniciarSesion(e) {

        e.preventDefault();

        if (cargando) {
            return;
        }

        setMensaje("");


        const emailLimpio =
            email
                .trim()
                .toLowerCase();


        if (
            !emailLimpio ||
            !password
        ) {

            setMensaje(
                "Completá el email y la contraseña."
            );

            return;

        }


        try {

            setCargando(true);


            const response =
                await fetch(
                    `${API}/clientes/login`,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                email:
                                    emailLimpio,

                                password
                            })
                    }
                );


            let datos = null;


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
                    "No se pudo iniciar sesión."
                );

                return;

            }


            if (
                !datos.token ||
                !datos.cliente
            ) {

                setMensaje(
                    "No se pudo crear una sesión segura."
                );

                return;

            }


            // ==================================
            // GUARDAR SESIÓN SEGURA
            // ==================================

            localStorage.setItem(
                "cliente_token",
                datos.token
            );


            localStorage.setItem(
                "cliente",
                JSON.stringify(
                    datos.cliente
                )
            );


            // ==================================
            // IR A MI CUENTA
            // ==================================

            navigate(
                "/mi-cuenta",
                {
                    replace:
                        true
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

        <section className="loginPage">

            <div className="loginCard">

                <h1>
                    Ingresar
                </h1>


                <p className="loginSubtitle">
                    Ingresá a tu cuenta de RC Conversiones.
                </p>


                <form
                    onSubmit={
                        iniciarSesion
                    }
                    autoComplete="on"
                >

                    <input
                        type="email"
                        name="email"
                        placeholder="Correo electrónico"
                        value={email}
                        onChange={(e) =>
                            setEmail(
                                e.target.value
                            )
                        }
                        autoComplete="email"
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

                        <p
                            className="loginMessage"
                            role="alert"
                        >
                            {mensaje}
                        </p>

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


                <p className="registerLink">

                    ¿Todavía no tenés una cuenta?

                    {" "}

                    <Link to="/registro">
                        Crear cuenta
                    </Link>

                </p>

            </div>

        </section>

    );

}
