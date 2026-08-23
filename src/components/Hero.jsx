import "../styles/Hero.css";

export default function Hero() {
    return (
        <section id="inicio" className="hero">

            <div className="overlay"></div>

            <div className="heroContent">

                

                <h1>
                    Todo para equipar tu
                    <br />
                    <span>Motorhome</span>
                </h1>

                <p>
                    Energía solar, heladeras 12/24V, baterías, calefacción,
                    accesorios y todo lo necesario para tu proyecto.
                </p>

                <div className="heroButtons">

                    <a href="#productos" className="primary">

                        Explorar Productos

                    </a>

                    <a href="#contacto" className="secondary">

                        Solicitar Asesoramiento

                    </a>

                </div>

            </div>

        </section>
    );
}