import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Register.css";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");


export default function Register() {

    const [formulario, setFormulario] = useState({
        nombre: "",
        email: "",
        telefono: "",
        password: "",
        confirmarPassword: ""
    });

    const [mensaje, setMensaje] = useState("");
    const [exito, setExito] = useState(false);
    const [cargando, setCargando] = useState(false);

    function cambiar(e) {

        setFormulario({
            ...formulario,
            [e.target.name]: e.target.value
        });

    }

    async function registrar(e) {

        e.preventDefault();

        setMensaje("");
        setExito(false);

        if (
            !formulario.nombre ||
            !formulario.email ||
            !formulario.telefono ||
            !formulario.password ||
            !formulario.confirmarPassword
        ) {

            setMensaje("Completá todos los campos.");

            return;

        }

        if (formulario.password !== formulario.confirmarPassword) {

            setMensaje("Las contraseñas no coinciden.");

            return;

        }

        if (formulario.password.length < 6) {

            setMensaje(
                "La contraseña debe tener al menos 6 caracteres."
            );

            return;

        }

        try {

            setCargando(true);

            const response = await fetch(
                `${API}/clientes/registro`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        nombre: formulario.nombre,

                        email: formulario.email,

                        telefono: formulario.telefono,

                        password: formulario.password

                    })
                }
            );

            const datos = await response.json();

            if (!response.ok || !datos.ok) {

                setMensaje(
                    datos.mensaje ||
                    "No se pudo crear la cuenta."
                );

                return;

            }

            /*
             * IMPORTANTE:
             *
             * Ya NO guardamos el cliente en localStorage
             * y NO iniciamos sesión automáticamente.
             *
             * Primero tiene que verificar su correo.
             */

            setExito(true);

            setMensaje(
                "Cuenta creada correctamente. Te enviamos un correo electrónico para verificar tu cuenta."
            );

            setFormulario({
                nombre: "",
                email: "",
                telefono: "",
                password: "",
                confirmarPassword: ""
            });

        } catch (error) {

            console.error(
                "Error registrando cliente:",
                error
            );

            setMensaje(
                "No se pudo conectar con el servidor."
            );

        } finally {

            setCargando(false);

        }

    }

    return (

        <section className="registerPage">

            <div className="registerCard">

                <h1>Crear cuenta</h1>

                <p className="registerSubtitle">

                    Registrate para solicitar presupuestos
                    y consultar tus pedidos.

                </p>

                {exito ? (

                    <div className="registerSuccess">

                        <h2>¡Cuenta creada!</h2>

                        <p>

                            Te enviamos un correo electrónico a la
                            dirección que registraste.

                        </p>

                        <p>

                            Revisá tu bandeja de entrada y hacé clic
                            en el enlace de verificación para activar
                            tu cuenta.

                        </p>

                        <p>

                            Si no aparece, revisá también la carpeta
                            de spam o correo no deseado.

                        </p>

                        <Link
                            className="loginButton"
                            to="/login"
                        >

                            Ir a Iniciar sesión

                        </Link>

                    </div>

                ) : (

                    <form onSubmit={registrar}>

                        <input
                            type="text"
                            name="nombre"
                            placeholder="Nombre completo"
                            value={formulario.nombre}
                            onChange={cambiar}
                            required
                        />

                        <input
                            type="email"
                            name="email"
                            placeholder="Correo electrónico"
                            value={formulario.email}
                            onChange={cambiar}
                            required
                        />

                        <input
                            type="tel"
                            name="telefono"
                            placeholder="Teléfono"
                            value={formulario.telefono}
                            onChange={cambiar}
                            required
                        />

                        <input
                            type="password"
                            name="password"
                            placeholder="Contraseña"
                            value={formulario.password}
                            onChange={cambiar}
                            required
                        />

                        <input
                            type="password"
                            name="confirmarPassword"
                            placeholder="Repetir contraseña"
                            value={formulario.confirmarPassword}
                            onChange={cambiar}
                            required
                        />

                        {mensaje && (

                            <p className="registerMessage">

                                {mensaje}

                            </p>

                        )}

                        <button
                            type="submit"
                            disabled={cargando}
                        >

                            {cargando
                                ? "Creando cuenta..."
                                : "Crear cuenta"
                            }

                        </button>

                    </form>

                )}

                {!exito && (

                    <p className="loginLink">

                        ¿Ya tenés una cuenta?

                        {" "}

                        <Link to="/login">

                            Iniciar sesión

                        </Link>

                    </p>

                )}

            </div>

        </section>

    );

}