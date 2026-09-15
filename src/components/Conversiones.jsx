import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "./Navbar";
import Cart from "./Cart";
import Footer from "./Footer";
import WhatsAppButton from "./WhatsAppButton";

import "../styles/Conversiones.css";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

const PLANES = [
    {
        id: "hasta-140",
        titulo: "Hasta 140 litros",
        precio: 250000
    },
    {
        id: "hasta-290",
        titulo: "Hasta 290 litros",
        precio: 350000
    },
    {
        id: "hasta-360",
        titulo: "Hasta 360 litros",
        precio: 450000
    }
];

function moneda(valor) {
    return Number(valor || 0).toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0
    });
}

function fechaLegible(valor) {
    if (!valor) return "A coordinar";
    const [anio, mes, dia] = valor.split("-");
    return dia + "/" + mes + "/" + anio;
}

export default function Conversiones() {
    const navigate = useNavigate();
    const [busqueda, setBusqueda] = useState("");
    const [carritoAbierto, setCarritoAbierto] = useState(false);
    const [planId, setPlanId] = useState("hasta-140");
    const [fecha, setFecha] = useState("");
    const [hora, setHora] = useState("");
    const [heladera, setHeladera] = useState("");
    const [comentarios, setComentarios] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [mensaje, setMensaje] = useState(null);

    const plan = useMemo(
        () => PLANES.find(item => item.id === planId) || PLANES[0],
        [planId]
    );

    const hoy = useMemo(() => {
        const ahora = new Date();
        const offset = ahora.getTimezoneOffset();
        return new Date(ahora.getTime() - offset * 60000)
            .toISOString()
            .slice(0, 10);
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = "Conversión de heladeras 12/24V | RC Conversiones";

        const token = localStorage.getItem("cliente_token");
        const pendiente = sessionStorage.getItem("rc_conversion_pendiente");

        if (token && pendiente) {
            try {
                const datos = JSON.parse(pendiente);
                if (datos.planId) setPlanId(datos.planId);
                if (datos.fecha) setFecha(datos.fecha);
                if (datos.hora) setHora(datos.hora);
                if (datos.heladera) setHeladera(datos.heladera);
                if (datos.comentarios) setComentarios(datos.comentarios);
                setMensaje({
                    tipo: "info",
                    texto: "Ya iniciaste sesión. Revisá los datos y confirmá la solicitud de turno."
                });
                setTimeout(() => {
                    document.getElementById("reservar-turno")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }, 150);
            } catch {
                sessionStorage.removeItem("rc_conversion_pendiente");
            }
        }
    }, []);

    function seleccionarPlan(id) {
        setPlanId(id);
        setMensaje(null);
        document.getElementById("reservar-turno")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    async function reservarTurno(event) {
        event.preventDefault();
        setMensaje(null);

        const token = localStorage.getItem("cliente_token");

        const pendiente = {
            planId,
            fecha,
            hora,
            heladera,
            comentarios
        };

        if (!token) {
            sessionStorage.setItem(
                "rc_conversion_pendiente",
                JSON.stringify(pendiente)
            );
            sessionStorage.setItem(
                "rc_volver_despues_login",
                "/conversiones"
            );

            navigate("/login", {
                state: { motivo: "conversion" }
            });
            return;
        }

        if (!fecha) {
            setMensaje({
                tipo: "error",
                texto: "Elegí una fecha preferida para solicitar el turno."
            });
            return;
        }

        const detalleTurno = [
            "Servicio: Conversión de heladera de 220V a 12/24V",
            "Capacidad: " + plan.titulo,
            "Fecha preferida: " + fechaLegible(fecha),
            "Horario preferido: " + (hora || "A coordinar"),
            "Heladera: " + (heladera.trim() || "No informado"),
            "Observaciones: " + (comentarios.trim() || "Sin observaciones")
        ].join(" | ");

        const producto = {
            id: "servicio-conversion-" + plan.id,
            codigo: "SERV.CONV." + plan.id.toUpperCase(),
            nombre:
                "Reserva conversión de heladera - " +
                plan.titulo +
                " - " +
                fechaLegible(fecha),
            categoria: "Conversiones",
            descripcion: detalleTurno,
            precio: plan.precio,
            cantidad: 1
        };

        const codigo = "RC-CONV-" + Date.now();

        try {
            setEnviando(true);

            const response = await fetch(API + "/presupuestos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token
                },
                body: JSON.stringify({
                    codigo,
                    productos: [producto],
                    total: plan.precio
                })
            });

            let data = {};
            try {
                data = await response.json();
            } catch {}

            if (response.status === 401 || response.status === 403) {
                sessionStorage.setItem(
                    "rc_conversion_pendiente",
                    JSON.stringify(pendiente)
                );
                sessionStorage.setItem(
                    "rc_volver_despues_login",
                    "/conversiones"
                );
                navigate("/login", {
                    state: { motivo: "conversion" }
                });
                return;
            }

            if (!response.ok || data?.ok === false) {
                throw new Error(
                    data?.mensaje || "No se pudo generar la solicitud de turno."
                );
            }

            sessionStorage.removeItem("rc_conversion_pendiente");
            sessionStorage.removeItem("rc_volver_despues_login");

            setMensaje({
                tipo: "exito",
                texto:
                    "Solicitud enviada correctamente. Ticket " +
                    (data?.codigo || codigo) +
                    ". Nos comunicaremos con vos para coordinar el turno."
            });

            setHora("");
            setHeladera("");
            setComentarios("");
        } catch (error) {
            setMensaje({
                tipo: "error",
                texto:
                    error?.message ||
                    "No se pudo generar la solicitud de turno."
            });
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="conversionesPage">
            <Navbar
                busqueda={busqueda}
                setBusqueda={setBusqueda}
                abrirCarrito={() => setCarritoAbierto(true)}
            />

            <main>
                <section className="conversionesHero">
                    <div className="conversionesHeroGlow" />
                    <div className="conversionesHeroContent">
                        <span className="conversionesEyebrow">
                            SERVICIO ESPECIALIZADO RC CONVERSIONES
                        </span>
                        <h1>
                            Convertí tu heladera de
                            <span> 220V a 12/24V</span>
                        </h1>
                        <p>
                            Adaptamos heladeras convencionales para uso en motorhomes,
                            campers y proyectos móviles. El servicio incluye el motor
                            y la mano de obra.
                        </p>
                        <div className="conversionesHeroActions">
                            <a href="#precios" className="conversionesPrimaryButton">
                                Ver precios
                            </a>
                            <a href="#reservar-turno" className="conversionesSecondaryButton">
                                Reservar turno
                            </a>
                        </div>
                    </div>
                </section>

                <section className="conversionesIntro">
                    <div className="conversionesSectionHeading">
                        <span>CONVERSIÓN 12/24V</span>
                        <h2>Un servicio pensado para tu proyecto</h2>
                        <p>
                            Recibimos la heladera en nuestro local, verificamos que se
                            encuentre funcionando correctamente y, si es compatible,
                            realizamos la conversión en el día.
                        </p>
                    </div>

                    <div className="conversionesFeatureGrid">
                        <article>
                            <span className="conversionesFeatureNumber">01</span>
                            <h3>Prueba al recibirla</h3>
                            <p>
                                Antes de comenzar comprobamos que la heladera ingrese
                                funcionando correctamente.
                            </p>
                        </article>
                        <article>
                            <span className="conversionesFeatureNumber">02</span>
                            <h3>Motor + mano de obra</h3>
                            <p>
                                El valor publicado contempla el motor utilizado para la
                                conversión y toda la mano de obra del servicio.
                            </p>
                        </article>
                        <article>
                            <span className="conversionesFeatureNumber">03</span>
                            <h3>Conversión en el día</h3>
                            <p>
                                El tiempo estimado es de aproximadamente 5 horas, siempre
                                que durante el trabajo no surja ningún inconveniente.
                            </p>
                        </article>
                    </div>
                </section>

                <section className="conversionesPrices" id="precios">
                    <div className="conversionesSectionHeading conversionesSectionHeadingLight">
                        <span>TARIFAS DE REFERENCIA</span>
                        <h2>Precios según capacidad</h2>
                        <p>
                            Elegí el rango correspondiente a la capacidad de tu heladera.
                        </p>
                    </div>

                    <div className="conversionesPriceGrid">
                        {PLANES.map((item, index) => (
                            <article
                                className={
                                    "conversionesPriceCard " +
                                    (index === 1 ? "conversionesPriceCardFeatured" : "")
                                }
                                key={item.id}
                            >
                                {index === 1 && (
                                    <span className="conversionesPopular">MÁS CONSULTADO</span>
                                )}
                                <span className="conversionesCapacity">{item.titulo}</span>
                                <strong>{moneda(item.precio)}</strong>
                                <div className="conversionesPriceIncludes">
                                    <span>✓ Motor incluido</span>
                                    <span>✓ Mano de obra incluida</span>
                                    <span>✓ Conversión 220V → 12/24V</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => seleccionarPlan(item.id)}
                                >
                                    Solicitar turno
                                </button>
                            </article>
                        ))}
                    </div>

                    <p className="conversionesInflationNote">
                        * Los precios son de referencia y pueden variar según la inflación
                        y la actualización de costos. El valor final se confirma al coordinar
                        el trabajo.
                    </p>
                </section>

                <section className="conversionesCompatibility">
                    <div className="conversionesCompatibilityCard conversionesCompatible">
                        <span className="conversionesCompatibilityBadge">SE PUEDE CONVERTIR</span>
                        <h2>Heladeras convencionales con motor</h2>
                        <p>
                            Trabajamos sobre heladeras que se encuentren funcionando y
                            utilicen un sistema convencional con motor/compresor.
                        </p>
                    </div>

                    <div className="conversionesCompatibilityCard conversionesNotCompatible">
                        <span className="conversionesCompatibilityBadge">NO REALIZAMOS</span>
                        <h2>Equipos con plaqueta o No Frost</h2>
                        <p>
                            No realizamos conversiones en heladeras con plaqueta electrónica
                            ni en modelos con tecnología No Frost.
                        </p>
                    </div>
                </section>

                <section className="conversionesBooking" id="reservar-turno">
                    <div className="conversionesBookingInfo">
                        <span>RESERVAR TURNO</span>
                        <h2>Solicitá tu conversión</h2>
                        <p>
                            Completá la solicitud y se generará un ticket en RC Conversiones.
                            Después nos comunicaremos con vos para confirmar disponibilidad,
                            revisar los datos de la heladera y coordinar el turno.
                        </p>
                        <div className="conversionesBookingNotice">
                            <strong>Importante</strong>
                            <p>
                                La solicitud no confirma automáticamente el turno. La heladera
                                será probada al ingresar al local y solo se realizará la conversión
                                si se encuentra funcionando y es compatible con el servicio.
                            </p>
                        </div>
                    </div>

                    <form className="conversionesBookingForm" onSubmit={reservarTurno}>
                        <label>
                            Capacidad de la heladera
                            <select
                                value={planId}
                                onChange={event => setPlanId(event.target.value)}
                            >
                                {PLANES.map(item => (
                                    <option value={item.id} key={item.id}>
                                        {item.titulo} — {moneda(item.precio)}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="conversionesFormRow">
                            <label>
                                Fecha preferida
                                <input
                                    type="date"
                                    min={hoy}
                                    value={fecha}
                                    onChange={event => setFecha(event.target.value)}
                                    required
                                />
                            </label>

                            <label>
                                Horario preferido
                                <input
                                    type="time"
                                    value={hora}
                                    onChange={event => setHora(event.target.value)}
                                />
                            </label>
                        </div>

                        <label>
                            Marca / modelo de la heladera
                            <input
                                type="text"
                                maxLength="120"
                                placeholder="Ej.: Patrick 280 L"
                                value={heladera}
                                onChange={event => setHeladera(event.target.value)}
                            />
                        </label>

                        <label>
                            Observaciones
                            <textarea
                                rows="4"
                                maxLength="500"
                                placeholder="Podés dejarnos algún dato adicional."
                                value={comentarios}
                                onChange={event => setComentarios(event.target.value)}
                            />
                        </label>

                        <div className="conversionesSelectedPrice">
                            <span>Valor de referencia</span>
                            <strong>{moneda(plan.precio)}</strong>
                        </div>

                        {mensaje && (
                            <div className={"conversionesMessage " + mensaje.tipo}>
                                {mensaje.texto}
                            </div>
                        )}

                        <button
                            className="conversionesSubmit"
                            type="submit"
                            disabled={enviando}
                        >
                            {enviando ? "Generando ticket..." : "Generar solicitud de turno"}
                        </button>

                        <small className="conversionesLoginHint">
                            Para generar el ticket necesitás iniciar sesión o tener una cuenta.
                        </small>
                    </form>
                </section>
            </main>

            <Footer />

            <Cart
                abierto={carritoAbierto}
                cerrar={() => setCarritoAbierto(false)}
            />

            <WhatsAppButton />
        </div>
    );
}
