import { useNavigate } from "react-router-dom";
import "../styles/Categories.css";

const categories = [
  {
    title: "Renogy",
    slug: "renogy",
    description: "Energía solar, baterías, inversores y control inteligente Renogy.",
    image: "/images/productos/renogy-24942.jpg"
  },

  {
    title: "Energía Solar",
    slug: "energia-solar",
    description: "Paneles solares, reguladores y soluciones de energía.",
    image: "/images/categories/panelsolar.jpg"
  },
  {
    title: "Heladeras",
    slug: "heladeras",
    description: "Heladeras 12V / 24V para motorhomes.",
    image: "/images/categories/heladera.webp"
  },
  {
    title: "Baterías",
    slug: "baterias",
    description: "Litio, gel y soluciones de almacenamiento.",
    image: "/images/categories/baterias.png"
  },
  {
    title: "Reguladores",
    slug: "reguladores",
    description: "Reguladores solares PWM y MPPT.",
    image: "/images/categories/reguladores.png"
  },
  {
    title: "Climatización",
    slug: "climatizacion",
    description: "Aires acondicionados y climatización para vehículos.",
    image: "/images/categorias/climatizacion-totalblack.webp"
  },
  {
    title: "Calefacción",
    slug: "calefaccion",
    description: "Calefactores y calderas diésel para motorhomes.",
    image: "/images/categorias/calefaccion-totalblack.jpg"
  },
  {
    title: "Ventilación",
    slug: "ventilacion",
    description: "Claraboyas, extractores, aireadores y rejillas.",
    image: "/images/categories/extractor.jpg"
  },
  {
    title: "Agua",
    slug: "agua",
    description: "Tanques, bombas y accesorios para el sistema de agua.",
    image: "/images/categories/griferia.jpeg"
  }
];

export default function Categories() {
  const navigate = useNavigate();

  return (
    <section id="categorias" className="categories">
      <div className="categoriesHeader">
        <span>CATÁLOGO RC CONVERSIONES</span>
        <h2>Nuestras categorías</h2>
        <p>Elegí una categoría para ver todos sus productos.</p>
      </div>

      <div className="categoriesGrid">
        {categories.map((cat) => (
          <article
            className="categoryCard"
            key={cat.slug}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/categoria/${cat.slug}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                navigate(`/categoria/${cat.slug}`);
              }
            }}
          >
            <div className="categoryCardImage">
              <img src={cat.image} alt={cat.title} />
              <span className="categoryNameBadge">{cat.title}</span>
            </div>

            <div className="categoryCardInfo">
              <h3>{cat.title}</h3>
              <p>{cat.description}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/categoria/${cat.slug}`);
                }}
              >
                Ver productos
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
