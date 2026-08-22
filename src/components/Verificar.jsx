import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "../styles/Register.css";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");


export default function Verificar() {

    const { codigo } = useParams();

    const [mensaje, setMensaje] = useState("Verificando tu cuenta...");
    const [exito, setExito] = useState(false);

    useEffect(() => {

        async function verificarCuenta() {

            try {

                const response = await fetch(
                    `${API}/clientes/verificar/${codigo}`
                );

                const datos = await response.json();

                if (datos.ok) {

                    setExito(true);
                    setMensaje(datos.mensaje);

                } else {

                    setExito(false);
                    setMensaje(
                        datos.mensaje ||
                        "No se pudo verificar la cuenta."
                    );

                }

            } catch (error) {

                console.error(
                    "Error verificando cuenta:",
                    error
                );

                setExito(false);

                setMensaje(
                    "No se pudo conectar con el servidor."
                );

            }

        }

        if (codigo) {

            verificarCuenta();

        } else {

            setMensaje(
                "Código de verificación inválido."
            );

        }

    }, [codigo]);


    return (

        <section className="registerPage">

            <div className="registerCard">

                {exito ? (

                    <>

                        <h1>¡Cuenta verificada! ✅</h1>

                        <p className="registerSubtitle">

                            Tu correo electrónico fue verificado
                            correctamente.

                        </p>

                        <p className="registerMessage">

                            Ya podés iniciar sesión en RC Conversiones.

                        </p>

                        <Link
                            to="/login"
                            className="loginButton"
                        >

                            Iniciar sesión

                        </Link>

                    </>

                ) : (

                    <>

                        <h1>Verificación</h1>

                        <p className="registerMessage">

                            {mensaje}

                        </p>

                    </>

                )}

            </div>

        </section>

    );

}