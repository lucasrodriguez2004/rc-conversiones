import { useEffect, useState } from "react";
import { obtenerProductos } from "../services/api";
import "../styles/FeaturedProducts.css";
import { useCart } from "../context/CartContext";

export default function FeaturedProducts() {
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const { agregarAlCarrito } = useCart();

    useEffect(() => {
        cargarProductos();
    }, []);

    async function cargarProductos() {
        try {
            setCargando(true);
            setError("");

            const datos = await obtenerProductos();

            setProductos(Array.isArray(datos) ? datos : []);
        } catch (err) {
            console.error("Error cargando productos:", err);

            setError(
                "No se pudieron cargar los productos. Intentá nuevamente."
            );
        } finally {
            setCargando(false);
        }
    }

    const textoBusqueda = busqueda.toLowerCase().trim();

    const filtrados = productos.filter((producto) => {
        const nombre = String(producto.nombre || "").toLowerCase();
        const categoria = String(producto.categoria || "").toLowerCase();

        return (
            nombre.includes(textoBusqueda) ||
            categoria.includes(textoBusqueda)
        );
    });

    return (
        <section id="productos" className="featured">

            <div className="featuredHeader">

                <div>
                    <span className="sectionLabel">
                        RC CONVERSIONES
                    </span>

                    <h2>Nuestros Productos</h2>

                    <p>
                        Encontrá todo lo necesario para equipar tu motorhome.
                    </p>
                </div>

                <div className="searchContainer">

                    <input
                        className="searchBar"
                        type="text"
                        placeholder="Buscar productos..."
                        value={busqueda}
                        onChange={(e) =>
                            setBusqueda(e.target.value)
                        }
                    />

                </div>

            </div>

            {cargando && (
                <div className="productsMessage">
                    <p>Cargando productos...</p>
                </div>
            )}

            {!cargando && error && (
                <div className="productsMessage error">
                    <p>{error}</p>

                    <button onClick={cargarProductos}>
                        Reintentar
                    </button>
                </div>
            )}

            {!cargando && !error && filtrados.length === 0 && (
                <div className="productsMessage">
                    {productos.length === 0 ? (
                        <>
                            <p>
                                Todavía no hay productos cargados.
                            </p>

                            <small>
                                Podés agregarlos desde el panel administrador.
                            </small>
                        </>
                    ) : (
                        <p>
                            No encontramos productos para "{busqueda}".
                        </p>
                    )}
                </div>
            )}

            {!cargando && !error && filtrados.length > 0 && (

                <div className="productGrid">

                    {filtrados.map((producto) => (

                        <div
                            className="productCard"
                            key={producto.id}
                        >

                            <div className="productImage">

                                <img
                                    src={
                                        producto.imagen ||
                                        "/images/producto-default.jpg"
                                    }
                                    alt={
                                        producto.nombre ||
                                        "Producto RC Conversiones"
                                    }
                                    onError={(e) => {
                                        e.currentTarget.src =
                                            "/images/producto-default.jpg";
                                    }}
                                />

                            </div>

                            <div className="productInfo">

                                <span className="productCategory">
                                    {producto.categoria || "Producto"}
                                </span>

                                <h3>
                                    {producto.nombre}
                                </h3>

                                {producto.descripcion && (
                                    <p className="productDescription">
                                        {producto.descripcion}
                                    </p>
                                )}

                                <strong className="productPrice">

                                    $
                                    {Number(
                                        producto.precio || 0
                                    ).toLocaleString("es-AR")}

                                </strong>

                                <div className="buttons">

                                    <button
                                        className="view"
                                        type="button"
                                    >
                                        Ver Producto
                                    </button>

                                    <button
                                        className="addCart"
                                        type="button"
                                        onClick={() =>
                                            agregarAlCarrito(producto)
                                        }
                                    >
                                        Agregar al carrito
                                    </button>

                                </div>

                            </div>

                        </div>

                    ))}

                </div>

            )}

        </section>
    );
}