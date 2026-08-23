import { useNavigate } from "react-router-dom";
import "../styles/Categories.css";

const categories = [
    {
        title: "Energía Solar",
        description: "Paneles, reguladores y soluciones para autonomía.",
        image: "/images/categories/panelsolar.jpg",
        slug: "energia-solar"
    },
    {
        title: "Heladeras",
        description: "Refrigeración 12V / 24V para cada viaje.",
        image: "/images/categories/heladera.webp",
        slug: "heladeras"
    },
    {
        title: "Baterías",
        description: "Litio, gel y almacenamiento de energía.",
        image: "/images/categories/baterias.png",
        slug: "baterias"
    },
    {
        title: "Reguladores",
        description: "Controladores PWM y MPPT.",
        image: "/images/categories/reguladores.png",
        slug: "reguladores"
    },
    {
        title: "Calefacción",
        description: "Calefones y climatización para motorhomes.",
        image: "/images/categories/caldera.png",
        slug: "calefaccion"
    },
    {
        title: "Accesorios",
        description: "Interior, equipamiento y soluciones prácticas.",
        image: "/images/categories/interior.webp",
        slug: "accesorios"
    },
    {
        title: "Ventilación",
        description: "Claraboyas, extractores y circulación de aire.",
        image: "/images/categories/extractor.jpg",
        slug: "ventilacion"
    },
    {
        title: "Grifería",
        description: "Canillas, duchadores y accesorios de agua.",
        image: "/images/categories/griferia.jpeg",
        slug: "griferia"
    }
];

export default function Categories() {
    const navigate = useNavigate();

    return (
        <section
            id="categorias"
            className="categories"
        >
            <div className="categoriesHeader">
                <span>CATÁLOGO</span>
                <h2>Categorías principales</h2>
                <p>
                    Elegí una categoría y encontrá el equipamiento
                    que necesitás para tu motorhome.
                </p>
            </div>

            <div className="grid">
                {categories.map((cat) => (
                    <button
                        type="button"
                        className="card"
                        key={cat.slug}
                        onClick={() =>
                            navigate(
                                `/categoria/${cat.slug}`
                            )
                        }
                    >
                        <div className="categoryImage">
                            <img
                                src={cat.image}
                                alt={cat.title}
                            />
                        </div>

                        <div className="info">
                            <h3>{cat.title}</h3>
                            <p>{cat.description}</p>
                            <span>
                                Ver productos
                                <b aria-hidden="true">→</b>
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
}
