import { useEffect, useState } from "react";
import { FaArrowRight, FaShoppingCart } from "react-icons/fa";
import { obtenerProductos } from "../services/api";
import { useCart } from "../context/CartContext";
import "../styles/Catalog.css";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");


export default function Catalog({ busqueda }) {

    const [productos, setProductos] = useState([]);

    const { agregarAlCarrito } = useCart();

    useEffect(() => {

        cargarProductos();

    }, []);

    async function cargarProductos() {

        try {

            const datos = await obtenerProductos();

            setProductos(datos || []);

        } catch (error) {

            console.error(
                "Error cargando productos:",
                error
            );

            setProductos([]);

        }

    }


    function agregarProducto(producto) {

        agregarAlCarrito({

            ...producto,

            imagen: producto.imagen
                ? `${API}${producto.imagen}`
                : "",

            cantidad: 1

        });

        alert(
            `${producto.nombre} fue agregado al carrito.`
        );

    }


    const filtrados = productos.filter((producto) => {

        const texto =
            busqueda?.toLowerCase() || "";

        return (

            producto.nombre
                ?.toLowerCase()
                .includes(texto)

            ||

            producto.categoria
                ?.toLowerCase()
                .includes(texto)

        );

    });


    return (

        <section
            id="productos"
            className="catalog"
        >

            <h2>
                Nuestro Catálogo
            </h2>

            <p>
                Todo lo necesario para equipar tu motorhome.
            </p>


            {filtrados.length === 0 ? (

                <div className="catalogEmpty">

                    <h3>
                        No hay productos disponibles
                    </h3>

                    <p>
                        Todavía no se agregaron productos al catálogo.
                    </p>

                </div>

            ) : (

                <div className="catalogGrid">

                    {filtrados.map((producto) => (

                        <div
                            className="catalogCard"
                            key={producto.id}
                        >

                            <div className="catalogImage">

                                <img
                                    src={
                                        producto.imagen
                                            ? `${API}${producto.imagen}`
                                            : ""
                                    }
                                    alt={producto.nombre}
                                />


                                <div className="overlay">

                                    <button onClick={() => agregarAlCarrito({
    id: producto.id,
    nombre: producto.nombre,
    precio: producto.precio,
    imagen: `${API}${producto.imagen}`
})}>
    Agregar al carrito
    <FaArrowRight />
</button>

                                </div>

                            </div>


                            <div className="catalogInfo">

                                <h3>
                                    {producto.nombre}
                                </h3>

                                <span>
                                    {producto.categoria}
                                </span>

                                <h4>

                                    $

                                    {Number(
                                        producto.precio
                                    ).toLocaleString(
                                        "es-AR"
                                    )}

                                </h4>


                                <button
                                    className="catalogCartButton"
                                    type="button"
                                    onClick={() =>
                                        agregarProducto(producto)
                                    }
                                >

                                    <FaShoppingCart />

                                    Agregar al carrito

                                </button>

                            </div>

                        </div>

                    ))}

                </div>

            )}

        </section>

    );

}