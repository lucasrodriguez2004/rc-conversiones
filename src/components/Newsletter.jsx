import "../styles/Newsletter.css";

export default function Newsletter() {

    return (

        <section className="newsletter">

            <h2>Recibí nuestras novedades</h2>

            <p>
                Enterate primero de ofertas, nuevos productos y promociones exclusivas.
            </p>

            <div className="newsletterBox">

                <input
                    type="email"
                    placeholder="Ingresá tu correo electrónico"
                />

                <button>Suscribirme</button>

            </div>

        </section>

    )

}