import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    FaArrowRight,
    FaShoppingCart
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "../styles/FeaturedProducts.css";

const API =
    (import.meta.env.VITE_API_URL || "http://localhost:5000")
        .replace(/\/+$/, "");

const SLUGS = {
    "Energía Solar": "energia-solar",
    "Reguladores": "reguladores",
    "Inversores": "inversores",
    "Baterías": "baterias",
    "Cargadores": "cargadores",
    "Electricidad": "electricidad",
    "Electrodomésticos": "electrodomesticos",
    "Heladeras": "heladeras",
    "Climatización": "climatizacion",
    "Calefacción": "calefaccion",
    "Cocina": "cocina",
    "Aberturas": "aberturas",
    "Ventilación": "ventilacion",
    "Herrajes": "herrajes",
    "Mobiliario": "mobiliario",
    "Seguridad": "seguridad",
    "Sanitarios": "sanitarios",
    "Grifería": "griferia",
    "Agua": "agua"
};

const FALLBACK_CATEGORIA = {
    "Energía Solar": "/images/categories/panelsolar.jpg",
    "Reguladores": "/images/categories/reguladores.png",
    "Baterías": "/images/categories/baterias.png",
    "Heladeras": "/images/categories/heladera.webp",
    "Calefacción": "/images/categories/caldera.png",
    "Ventilación": "/images/categories/extractor.jpg",
    "Sanitarios": "/images/categories/interior.webp",
    "Grifería": "/images/categories/griferia.jpeg",
    "Agua": "/images/categories/griferia.jpeg"
};

function resolverImagen(imagen) {
    if (!imagen) {
        return "/images/logo.png";
    }

    const valor = String(imagen).trim();

    // Las imágenes del catálogo están dentro de public/images/productos.
    // Si MySQL trae una URL absoluta de Vercel, usamos solo el pathname
    // para que funcione también en localhost.
    try {
        if (
            valor.startsWith("http://") ||
            valor.startsWith("https://")
        ) {
            const url = new URL(valor);

            if (
                url.pathname.startsWith(
                    "/images/productos/"
                )
            ) {
                return url.pathname;
            }

            return valor;
        }
    } catch {
        // Sigue con las comprobaciones de abajo.
    }

    if (
        valor.startsWith(
            "/images/productos/"
        )
    ) {
        return valor;
    }

    if (valor.startsWith("/uploads/")) {
        return `${API}${valor}`;
    }

    if (valor.startsWith("/")) {
        return valor;
    }

    if (
        valor.toLowerCase().endsWith(".webp") ||
        valor.toLowerCase().endsWith(".png") ||
        valor.toLowerCase().endsWith(".jpg") ||
        valor.toLowerCase().endsWith(".jpeg")
    ) {
        return `/images/productos/${valor}`;
    }

    return valor;
}

function slugCategoria(categoria) {
    if (SLUGS[categoria]) {
        return SLUGS[categoria];
    }

    return String(categoria || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

export default function FeaturedProducts() {
    const navigate = useNavigate();

    const {
        agregarAlCarrito
    } = useCart();

    const [productos, setProductos] =
        useState([]);

    const [cargando, setCargando] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        let activo = true;

        async function cargar() {
            try {
                setCargando(true);
                setError("");

                const response =
                    await fetch(
                        `${API}/productos`
                    );

                if (!response.ok) {
                    throw new Error(
                        "No se pudieron cargar los productos."
                    );
                }

                const datos =
                    await response.json();

                if (!activo) {
                    return;
                }

                setProductos(
                    Array.isArray(datos)
                        ? datos.filter(
                            producto =>
                                producto &&
                                producto.categoria &&
                                producto.imagen
                        )
                        : []
                );
            } catch (err) {
                console.error(
                    "Error cargando productos del inicio:",
                    err
                );

                if (activo) {
                    setError(
                        "No pudimos cargar los productos."
                    );
                }
            } finally {
                if (activo) {
                    setCargando(false);
                }
            }
        }

        cargar();

        return () => {
            activo = false;
        };
    }, []);

    // UNA SOLA tarjeta representativa por categoría.
    const representantes =
        useMemo(() => {
            const mapa = new Map();

            for (const producto of productos) {
                const categoria =
                    String(
                        producto.categoria || ""
                    ).trim();

                if (
                    !categoria ||
                    mapa.has(categoria)
                ) {
                    continue;
                }

                mapa.set(
                    categoria,
                    producto
                );
            }

            return Array.from(
                mapa.values()
            );
        }, [productos]);

    // Duplicamos las tarjetas únicamente para lograr
    // el movimiento infinito sin cortes visuales.
    const carrusel =
        representantes.length
            ? [
                ...representantes,
                ...representantes
            ]
            : [];

    if (cargando) {
        return (
            <section
                id="productos"
                className="featured featuredCarrusel"
            >
                <div className="featuredHeader">
                    <div>
                        <span>
                            CATÁLOGO RC CONVERSIONES
                        </span>

                        <h2>
                            Productos por categoría
                        </h2>

                        <p>
                            Cargando productos...
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    if (error || representantes.length === 0) {
        return (
            <section
                id="productos"
                className="featured featuredCarrusel"
            >
                <div className="featuredHeader">
                    <div>
                        <span>
                            CATÁLOGO RC CONVERSIONES
                        </span>

                        <h2>
                            Productos por categoría
                        </h2>

                        <p>
                            {error ||
                                "No hay productos para mostrar."}
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section
            id="productos"
            className="featured featuredCarrusel"
        >
            <div className="featuredHeader">
                <div>
                    <span>
                        CATÁLOGO RC CONVERSIONES
                    </span>

                    <h2>
                        Un vistazo a nuestro catálogo
                    </h2>

                    <p>
                        Un producto de cada categoría.
                        Pasá el mouse para pausar el recorrido
                        o entrá a una categoría para ver todos.
                    </p>
                </div>

                <button
                    type="button"
                    className="featuredTodos"
                    onClick={() =>
                        navigate(
                            "/categoria/todos"
                        )
                    }
                >
                    Ver catálogo completo
                    <FaArrowRight />
                </button>
            </div>

            <div className="featuredViewport">
                <div className="featuredTrack">
                    {carrusel.map(
                        (producto, index) => {
                            const categoria =
                                producto.categoria;

                            const slug =
                                slugCategoria(
                                    categoria
                                );

                            const imagen =
                                resolverImagen(
                                    producto.imagen
                                );

                            return (
                                <article
                                    className="featuredProductCard"
                                    key={
                                        `${producto.id}-${index}`
                                    }
                                    onClick={() =>
                                        navigate(
                                            `/categoria/${slug}`
                                        )
                                    }
                                >
                                    <div className="featuredProductImage">
                                        <img
                                            src={imagen}
                                            alt={
                                                producto.nombre
                                            }
                                            loading="lazy"
                                            onError={(event) => {
                                                const fallback =
                                                    FALLBACK_CATEGORIA[
                                                        categoria
                                                    ] ||
                                                    "/images/logo.png";

                                                if (
                                                    event.currentTarget.src
                                                        .endsWith(
                                                            fallback
                                                        )
                                                ) {
                                                    return;
                                                }

                                                event.currentTarget.src =
                                                    fallback;
                                            }}
                                        />
                                    </div>

                                    <div className="featuredProductInfo">
                                        <span className="featuredCategory">
                                            {categoria}
                                        </span>

                                        <h3>
                                            {producto.nombre}
                                        </h3>

                                        {producto.codigo && (
                                            <small>
                                                Código:{" "}
                                                {
                                                    producto.codigo
                                                }
                                            </small>
                                        )}

                                        <div className="featuredProductBottom">
                                            <strong className="precioConsultar">Consultar</strong>

                                            <button
                                                type="button"
                                                onClick={(
                                                    event
                                                ) => {
                                                    event.stopPropagation();

                                                    agregarAlCarrito(
                                                        {
                                                            ...producto,
                                                            imagen
                                                        }
                                                    );
                                                }}
                                            >
                                                <FaShoppingCart />
                                                Agregar
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        }
                    )}
                </div>
            </div>
        </section>
    );
}
