import { useState } from "react";
import "../styles/Newsletter.css";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export default function Newsletter() {
    const [email, setEmail] = useState("");
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [tipoMensaje, setTipoMensaje] = useState("");

    const suscribirse = async (e) => {
        e.preventDefault();

        const correo = email.trim();

        if (!correo) {
            setTipoMensaje("error");
            setMensaje("Ingresá tu correo electrónico.");
            return;
        }

        setCargando(true);
        setMensaje("");

        try {
            const respuesta = await fetch(`${API}/newsletter`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: correo,
                }),
            });

            const data = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    data?.mensaje ||
                    "No pudimos completar la suscripción."
                );
            }

            setTipoMensaje("exito");
            setMensaje("¡Gracias! Te suscribiste correctamente.");
            setEmail("");
        } catch (error) {
            console.error("Error newsletter:", error);

            setTipoMensaje("error");
            setMensaje(
                error.message ||
                "Ocurrió un error. Intentá nuevamente."
            );
        } finally {
            setCargando(false);
        }
    };

    return (
        <section className="newsletter">
            <h2>Recibí nuestras novedades</h2>

            <p>
                Enterate primero de ofertas, nuevos productos y promociones exclusivas.
            </p>

            <form
                className="newsletterBox"
                onSubmit={suscribirse}
            >
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ingresá tu correo electrónico"
                    autoComplete="email"
                    required
                />

                <button
                    type="submit"
                    disabled={cargando}
                >
                    {cargando ? "Suscribiendo..." : "Suscribirme"}
                </button>
            </form>

            {mensaje && (
                <p
                    className={`newsletterMensaje ${tipoMensaje}`}
                    role="status"
                >
                    {mensaje}
                </p>
            )}
        </section>
    );
}