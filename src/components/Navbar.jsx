import "../styles/Navbar.css";
import { useEffect as useCatalogEffect, useState as useCatalogState } from "react";
import {
    FaShoppingCart,
    FaUser,
    FaSearch,
    FaChevronDown,
    FaTimes
} from "react-icons/fa";
import {
    useEffect,
    useRef,
    useState
} from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useCatalogoCategorias } from "../hooks/useCatalogoCategorias";


// RC_CATALOGO_DINAMICO_V1
const CATALOGO_API =
  (
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000"
  ).replace(/\/+$/, "");

export default function Navbar({
    busqueda = "",
    setBusqueda,
    abrirCarrito
}) {
    const navigate = useNavigate();
    const CATALOGO_CATEGORIAS = useCatalogoCategorias();
        const [
        catalogoDinamico,
        setCatalogoDinamico
    ] = useCatalogState(
        CATALOGO_CATEGORIAS
    );

    useCatalogEffect(() => {
        let activo = true;

        fetch(
            CATALOGO_API +
            "/catalogo-categorias"
        )
            .then(response => {
                if (!response.ok) {
                    throw new Error(
                        "No se pudo cargar el catálogo."
                    );
                }

                return response.json();
            })
            .then(data => {
                if (
                    activo &&
                    data?.ok &&
                    Array.isArray(
                        data.categorias
                    ) &&
                    data.categorias.length
                ) {
                    setCatalogoDinamico(
                        data.categorias
                    );
                }
            })
            .catch(error => {
                console.warn(
                    "Usando categorías locales:",
                    error.message
                );
            });

        return () => {
            activo = false;
        };
    }, []);

const { carrito } = useCart();

    const [menuAbierto, setMenuAbierto] =
        useState(false);

    const menuRef = useRef(null);
    const megaRef = useRef(null);

    const cantidad = carrito.reduce(
        (total, item) =>
            total + Number(item.cantidad || 0),
        0
    );

    useEffect(() => {
        function cerrarAlTocarAfuera(event) {
            const clickEnTrigger =
                menuRef.current &&
                menuRef.current.contains(event.target);

            const clickEnMega =
                megaRef.current &&
                megaRef.current.contains(event.target);

            if (!clickEnTrigger && !clickEnMega) {
                setMenuAbierto(false);
            }
        }

        function cerrarConEscape(event) {
            if (event.key === "Escape") {
                setMenuAbierto(false);
            }
        }

        document.addEventListener(
            "mousedown",
            cerrarAlTocarAfuera
        );

        document.addEventListener(
            "keydown",
            cerrarConEscape
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                cerrarAlTocarAfuera
            );

            document.removeEventListener(
                "keydown",
                cerrarConEscape
            );
        };
    }, []);

    function irInicio(hash = "") {
        setMenuAbierto(false);

        if (window.location.pathname === "/") {
            if (hash) {
                document
                    .getElementById(hash)
                    ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
            } else {
                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            }
            return;
        }

        navigate(hash ? `/#${hash}` : "/");
    }

    function irCategoria(slug) {
        setMenuAbierto(false);
        navigate(`/categoria/${slug}`);
    }

    function irSubcategoria(
        categoriaSlug,
        subcategoria
    ) {
        setMenuAbierto(false);

        navigate(
            `/categoria/${categoriaSlug}?subcategoria=${encodeURIComponent(
                subcategoria
            )}`
        );
    }

    // RC_BUSCADOR_GLOBAL_V1
    function ejecutarBusqueda(texto = busqueda) {
        const termino =
            String(texto || "").trim();

        if (!termino) {
            return;
        }

        navigate(
            `/categoria/todos?buscar=${encodeURIComponent(
                termino
            )}`
        );
    }


    return (
        <>
            <header className="navbar">
                <div className="rcBrandWrap">
                    <a
                        href="/"
                        className="rcBrand"
                        aria-label="RC Conversiones - Inicio"
                    >
                        <span className="rcBrandMonogram">
                            RC
                        </span>

                        <span className="rcBrandText">
                            <strong>
                                CONVERSIONES
                            </strong>

                            <small>
                                EQUIPAMIENTO PARA MOTORHOMES
                            </small>
                        </span>
                    </a>
                </div>

                <nav>
                    <button
                        type="button"
                        className="navLinkButton"
                        onClick={() => irInicio()}
                    >
                        Inicio
                    </button>

                    <button
                        type="button"
                        className="navLinkButton"
                        onClick={() =>
                            irInicio("productos")
                        }
                    >
                        Productos
                    </button>

                    <div
                        className="navCategorias"
                        ref={menuRef}
                    >
                        <button
                            type="button"
                            className={
                                `categoriasTrigger ${menuAbierto
                                    ? "activo"
                                    : ""}`
                            }
                            aria-haspopup="true"
                            aria-expanded={menuAbierto}
                            onClick={() =>
                                setMenuAbierto(
                                    actual => !actual
                                )
                            }
                        >
                            <span>Categorías</span>
                            <FaChevronDown />
                        </button>
                    </div>

                    <button
                        type="button"
                        className="navLinkButton"
                        onClick={() =>
                            irInicio("contacto")
                        }
                    >
                        Contacto
                    </button>
                </nav>

                <div className="navbarRight">
                    <div className="search">
                        <FaSearch />

                        <input
                            type="search"
                            placeholder="Buscar productos..."
                            value={busqueda || ""}
                            onChange={(e) => {
                                if (
                                    typeof setBusqueda ===
                                    "function"
                                ) {
                                    setBusqueda(
                                        e.target.value
                                    );
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    ejecutarBusqueda(
                                        e.currentTarget.value
                                    );
                                }
                            }}
                            aria-label="Buscar productos"
                        />
                    </div>

                    <button
                        className="cartIcon"
                        onClick={() => {
                            if (
                                typeof abrirCarrito ===
                                "function"
                            ) {
                                abrirCarrito();
                            }
                        }}
                        type="button"
                        aria-label="Abrir carrito"
                    >
                        <FaShoppingCart />

                        {cantidad > 0 && (
                            <span>{cantidad}</span>
                        )}
                    </button>

                    <button
                        className="login"
                        type="button"
                        onClick={() =>
                            navigate("/login")
                        }
                    >
                        <FaUser />
                        <span>Ingresar</span>
                    </button>
                </div>
            </header>

            <div
                className={
                    `megaCategoriasBackdrop ${menuAbierto
                        ? "visible"
                        : ""}`
                }
                onClick={() =>
                    setMenuAbierto(false)
                }
            />

            <section
                ref={megaRef}
                className={
                    `megaCategorias ${menuAbierto
                        ? "abierto"
                        : ""}`
                }
                aria-hidden={!menuAbierto}
            >
                <div className="megaCategoriasInner">
                    <div className="megaCategoriasHeader">
                        <div>
                            <span>
                                CATÁLOGO RC CONVERSIONES
                            </span>

                            <h2>
                                Elegí qué querés ver
                            </h2>

                            <p>
                                Entrá por categoría o directamente
                                a una subcategoría.
                            </p>
                        </div>

                        <div className="megaCategoriasAcciones">
                            <button
                                type="button"
                                className="megaVerTodos"
                                onClick={() =>
                                    irCategoria("todos")
                                }
                            >
                                Ver todos
                            </button>

                            <button
                                type="button"
                                className="megaCerrar"
                                aria-label="Cerrar categorías"
                                onClick={() =>
                                    setMenuAbierto(false)
                                }
                            >
                                <FaTimes />
                            </button>
                        </div>
                    </div>

                    <div className="megaCategoriasColumns">
                        {catalogoDinamico.map(
                            categoria => (
                                <div
                                    className="megaCategoriaGrupo"
                                    key={categoria.slug}
                                >
                                    <button
                                        type="button"
                                        className="megaCategoriaTitulo"
                                        onClick={() =>
                                            irCategoria(
                                                categoria.slug
                                            )
                                        }
                                    >
                                        {categoria.nombre}
                                        <span>→</span>
                                    </button>

                                    <div className="megaSubcategorias">
                                        {categoria.subcategorias.map(
                                            subcategoria => (
                                                <button
                                                    type="button"
                                                    key={
                                                        subcategoria
                                                    }
                                                    onClick={() =>
                                                        irSubcategoria(
                                                            categoria.slug,
                                                            subcategoria
                                                        )
                                                    }
                                                >
                                                    {
                                                        subcategoria
                                                    }
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
