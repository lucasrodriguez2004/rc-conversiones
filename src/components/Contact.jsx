import "../styles/Contact.css";

export default function Contact() {

  function enviarConsulta(e) {

    e.preventDefault();

    alert("Consulta enviada correctamente.");

  }

  return (

    <section id="contacto" className="contact">

      <h2>Solicitar Asesoramiento</h2>

      <p>
        Completá el formulario y uno de nuestros vendedores se pondrá en contacto con vos.
      </p>

      <form onSubmit={enviarConsulta}>

        <input
          type="text"
          placeholder="Nombre y Apellido"
          required
        />

        <input
          type="email"
          placeholder="Correo Electrónico"
          required
        />

        <input
          type="tel"
          placeholder="WhatsApp"
          required
        />

        <select required>

          <option value="">Seleccioná un producto</option>

          <option>Heladeras 12/24V</option>

          <option>Energía Solar</option>

          <option>Baterías</option>

          <option>Reguladores</option>

          <option>Inversores</option>

          <option>Calefacción</option>

          <option>Ventilación</option>

          <option>Accesorios</option>

        </select>

        <textarea
          rows="6"
          placeholder="Escribí tu consulta..."
          required
        />

        <button type="submit">
          Enviar Consulta
        </button>

      </form>

    </section>

  );

}