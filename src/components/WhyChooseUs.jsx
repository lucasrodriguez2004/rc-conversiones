import "../styles/WhyChooseUs.css";

export default function WhyChooseUs() {
  return (
    <section className="whyChoose">

      <h2>¿Por qué elegir RC Conversiones?</h2>

      <div className="whyGrid">

        <div className="whyCard">
          <span>⚡</span>
          <h3>Productos de Calidad</h3>
          <p>Trabajamos con marcas reconocidas para garantizar el mejor rendimiento.</p>
        </div>

        <div className="whyCard">
          <span>🛠️</span>
          <h3>Asesoramiento Personalizado</h3>
          <p>Te ayudamos a elegir el equipamiento ideal para tu motorhome.</p>
        </div>

        <div className="whyCard">
          <span>🚚</span>
          <h3>Envíos a Todo el País</h3>
          <p>Realizamos envíos seguros a cualquier punto de Argentina.</p>
        </div>

        <div className="whyCard">
          <span>🔒</span>
          <h3>Compra Segura</h3>
          <p>Atención personalizada y seguimiento durante todo el proceso de compra.</p>
        </div>

      </div>

    </section>
  );
}