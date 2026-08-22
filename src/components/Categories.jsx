import "../styles/Categories.css";

const categories = [
  {
    title: "Energía Solar",
    description: "Paneles solares, kits y accesorios.",
    image: "/images/categories/panelsolar.jpg", // TU FOTO
  },
  {
    title: "Heladeras 12V / 24V",
    description: "Bajo mesada y portátiles hasta 290 litros.",
    image: "/images/categories/heladera.webp", // FOTO DE EJEMPLO (después la cambiamos)
  },
  {
    title: "Baterías de Litio",
    description: "Baterías de litio, gel y accesorios.",
    image: "/images/categories/baterias.png", // TU FOTO
  },
  {
    title: "Reguladores Solares",
    description: "PWM y MPPT.",
    image: "/images/categories/reguladores.png", // TU FOTO
  },
  {
    title: "Calefacción",
    description: "Calefones y calefacción para motorhomes.",
    image: "/images/categories/caldera.png", // TU FOTO
  },
  {
    title: "Interior para Motorhomes",
    description: "Bachas, mesas, sanitarios y accesorios.",
    image: "/images/categories/interior.webp",
  },
  {
    title: "Ventilación",
    description: "Claraboyas, extractores y rejillas.",
    image: "/images/categories/extractor.jpg",
  },
  {
    title: "Grifería y Canillas",
    description: "Canillas y duchadores para motorhomes.",
    image: "/images/categories/griferia.jpeg",
  },
];

export default function Categories() {
  return (
    <section id="categorias" className="categories">

      <h2>Nuestras Categorías</h2>

      <div className="grid">

        {categories.map((cat) => (

          <div className="card" key={cat.title}>

            <img src={cat.image} alt={cat.title} />

            <div className="info">

              <h3>{cat.title}</h3>

              <button>Ver Productos</button>

            </div>

          </div>

        ))}

      </div>

    </section>
  );
}