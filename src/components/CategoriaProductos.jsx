import {
    useEffect,
    useMemo,
    useState
} from "react";
import {
    useNavigate,
    useParams,
    useSearchParams
} from "react-router-dom";
import {
    FaArrowLeft,
    FaSearch,
    FaShoppingCart
} from "react-icons/fa";

import { useCart } from "../context/CartContext";
import { CATALOGO_CATEGORIAS } from "../data/catalogoCategorias";
import "../styles/CategoriaProductos.css";

const API =
    (import.meta.env.VITE_API_URL || "")
        .replace(/\/+$/, "");

function normalizar(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function imagenProducto(imagen) {
    if (!imagen) {
        return "/images/logo.png";
    }

    if (
        imagen.startsWith("http://") ||
        imagen.startsWith("https://") ||
        imagen.startsWith("/")
    ) {
        if (
            imagen.startsWith("/") &&
            API &&
            imagen.startsWith("/uploads/")
        ) {
            return `${API}${imagen}`;
        }

        return imagen;
    }

    return API
        ? `${API}/${imagen}`
        : `/${imagen}`;
}

export default function CategoriaProductos() {
    const { slug } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { agregarAlCarrito } = useCart();

    const [productos, setProductos] =
        useState([]);
    const [busqueda, setBusqueda] =
        useState("");
    const [cargando, setCargando] =
        useState(true);
    const [error, setError] =
        useState("");

    const categoria =
        CATALOGO_CATEGORIAS.find(
            item => item.slug === slug
        );

    const tituloCategoria =
        slug === "todos"
            ? "Todos los productos"
            : categoria?.nombre ||
              "Productos";

    const subcategoriaActiva =
        searchParams.get("subcategoria") || "";

    useEffect(() => {
        window.scrollTo(0, 0);

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

                setProductos(
                    Array.isArray(datos)
                        ? datos
                        : []
                );
            } catch (err) {
                console.error(
                    "Error cargando productos:",
                    err
                );

                setError(
                    err.message ||
                    "No se pudieron cargar los productos."
                );
            } finally {
                setCargando(false);
            }
        }

        cargar();
    }, [slug, subcategoriaActiva]);

    const productosFiltrados =
        useMemo(() => {
            const texto =
                normalizar(busqueda);

            return productos.filter(
                producto => {
                    const coincideCategoria =
                        slug === "todos" ||
                        normalizar(
                            producto.categoria
                        ) ===
                            normalizar(
                                tituloCategoria
                            );

                    if (!coincideCategoria) {
                        return false;
                    }

                    if (
                        subcategoriaActiva &&
                        normalizar(
                            producto.subcategoria
                        ) !==
                            normalizar(
                                subcategoriaActiva
                            )
                    ) {
                        return false;
                    }

                    if (!texto) {
                        return true;
                    }

                    return [
                        producto.nombre,
                        producto.codigo,
                        producto.categoria,
                        producto.subcategoria,
                        producto.descripcion,
                        producto.caracteristicas
                    ].some(
                        valor =>
                            normalizar(valor).includes(
                                texto
                            )
                    );
                }
            );
        }, [
            productos,
            busqueda,
            slug,
            tituloCategoria,
            subcategoriaActiva
        ]);

    return (
        <main className="categoriaProductosPage">
            <div className="categoriaProductosTop">
                <button
                    type="button"
                    className="categoriaVolver"
                    onClick={() => navigate("/")}
                >
                    <FaArrowLeft />
                    Volver al inicio
                </button>

                <button
                    type="button"
                    className="categoriaVerCarrito"
                    onClick={() =>
                        navigate("/#productos")
                    }
                >
                    <FaShoppingCart />
                    Seguir comprando
                </button>
            </div>

            <section className="categoriaProductosHero">
                <span>RC CONVERSIONES</span>

                <h1>
                    {subcategoriaActiva ||
                        tituloCategoria}
                </h1>

                {subcategoriaActiva && (
                    <p className="categoriaBreadcrumb">
                        {tituloCategoria}
                        {"  /  "}
                        {subcategoriaActiva}
                    </p>
                )}

                <p>
                    Encontrá equipamiento para tu
                    motorhome y agregalo al carrito
                    para solicitar tu presupuesto.
                </p>
            </section>

            <section className="categoriaProductosContenido">
                <div className="categoriaProductosToolbar">
                    <div className="categoriaBuscador">
                        <FaSearch />

                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) =>
                                setBusqueda(
                                    e.target.value
                                )
                            }
                            placeholder={
                                `Buscar en ${subcategoriaActiva ||
                                    tituloCategoria}...`
                            }
                        />
                    </div>

                    {!cargando && !error && (
                        <span className="categoriaCantidad">
                            {
                                productosFiltrados.length
                            }{" "}
                            producto
                            {
                                productosFiltrados.length !==
                                1
                                    ? "s"
                                    : ""
                            }
                        </span>
                    )}
                </div>

                {cargando && (
                    <div className="categoriaEstado">
                        Cargando productos...
                    </div>
                )}

                {error && (
                    <div className="categoriaEstado categoriaError">
                        {error}
                    </div>
                )}

                {!cargando &&
                    !error &&
                    productosFiltrados.length ===
                        0 && (
                        <div className="categoriaVacia">
                            <h2>
                                Todavía no hay productos
                                para mostrar
                            </h2>

                            <p>
                                Probá con otra categoría
                                o volvé a ver todo el catálogo.
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/categoria/todos"
                                    )
                                }
                            >
                                Ver todos los productos
                            </button>
                        </div>
                    )}

                {!cargando &&
                    !error &&
                    productosFiltrados.length >
                        0 && (
                        <div className="categoriaProductosGrid">
                            {productosFiltrados.map(
                                producto => (
                                    <article
                                        className="categoriaProductoCard"
                                        key={
                                            producto.id
                                        }
                                    >
                                        <div className="categoriaProductoImagen">
                                            <img
                                                src={imagenProducto(
                                                    producto.imagen
                                                )}
                                                alt={
                                                    producto.nombre
                                                }
                                            />
                                        </div>

                                        <div className="categoriaProductoInfo">
                                            <span className="categoriaProductoCategoria">
                                                {
                                                    producto.subcategoria ||
                                                    producto.categoria
                                                }
                                            </span>

                                            <h2>
                                                {
                                                    producto.nombre
                                                }
                                            </h2>

                                            {producto.descripcion && (
                                                <p>
                                                    {
                                                        producto.descripcion
                                                    }
                                                </p>
                                            )}

                                            <div className="categoriaProductoPie">
                                                <strong>
                                                    {Number(
                                                        producto.precio ||
                                                            0
                                                    ) > 0
                                                        ? `$${Number(
                                                              producto.precio
                                                          ).toLocaleString(
                                                              "es-AR"
                                                          )}`
                                                        : "Consultar"}
                                                </strong>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        agregarAlCarrito(
                                                            producto
                                                        )
                                                    }
                                                >
                                                    <FaShoppingCart />
                                                    Agregar
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                )
                            )}
                        </div>
                    )}
            </section>
        </main>
    );
}
