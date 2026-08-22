import { useEffect, useState } from "react";

import {
    obtenerProductos,
    agregarProducto,
    editarProducto,
    eliminarProducto,
    subirImagen
} from "../services/api";

import "../styles/ProductTable.css";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export default function ProductTable() {

    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState("");

    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [editando, setEditando] = useState(null);

    const [imagenFile, setImagenFile] = useState(null);
    const [subiendoImagen, setSubiendoImagen] = useState(false);

    const [formulario, setFormulario] = useState({
        nombre: "",
        categoria: "",
        precio: "",
        stock: "",
        descripcion: "",
        imagen: "",
        destacado: 0
    });

    useEffect(() => {
        cargarProductos();
    }, []);

    async function cargarProductos() {

        try {

            const datos = await obtenerProductos();

            setProductos(
                Array.isArray(datos) ? datos : []
            );

        } catch (error) {

            console.error(
                "Error cargando productos:",
                error
            );

            alert(
                "No se pudieron cargar los productos."
            );
        }
    }

    function cambiarCampo(e) {

        const { name, value } = e.target;

        setFormulario((prev) => ({
            ...prev,
            [name]: value
        }));
    }

    function nuevoProducto() {

        setEditando(null);

        setFormulario({
            nombre: "",
            categoria: "",
            precio: "",
            stock: "",
            descripcion: "",
            imagen: "",
            destacado: 0
        });

        setImagenFile(null);
        setMostrarFormulario(true);
    }

    function editar(producto) {

        setEditando(producto);

        setFormulario({
            nombre: producto.nombre || "",
            categoria: producto.categoria || "",
            precio: producto.precio || "",
            stock: producto.stock || "",
            descripcion: producto.descripcion || "",
            imagen: producto.imagen || "",
            destacado: producto.destacado || 0
        });

        setImagenFile(null);
        setMostrarFormulario(true);
    }

    function cancelar() {

        setMostrarFormulario(false);
        setEditando(null);
        setImagenFile(null);
    }

    async function guardarProducto(e) {

        e.preventDefault();

        if (!formulario.nombre.trim()) {

            alert(
                "El nombre del producto es obligatorio."
            );

            return;
        }

        try {

            let rutaImagen = formulario.imagen;

            if (imagenFile) {

                setSubiendoImagen(true);

                const resultado =
                    await subirImagen(imagenFile);

                setSubiendoImagen(false);

                if (!resultado.ok) {

                    alert(
                        resultado.mensaje ||
                        "No se pudo subir la imagen."
                    );

                    return;
                }

                rutaImagen = resultado.ruta;
            }

            const producto = {

                nombre: formulario.nombre,

                categoria: formulario.categoria,

                precio:
                    Number(formulario.precio) || 0,

                stock:
                    Number(formulario.stock) || 0,

                descripcion:
                    formulario.descripcion,

                imagen:
                    rutaImagen || null,

                destacado:
                    Number(formulario.destacado) || 0
            };

            if (editando) {

                const resultado =
                    await editarProducto(
                        editando.id,
                        producto
                    );

                if (!resultado.ok) {

                    alert(
                        resultado.mensaje ||
                        "No se pudo actualizar el producto."
                    );

                    return;
                }

                alert(
                    "Producto actualizado correctamente."
                );

            } else {

                const resultado =
                    await agregarProducto(producto);

                if (!resultado.ok) {

                    alert(
                        resultado.mensaje ||
                        "No se pudo agregar el producto."
                    );

                    return;
                }

                alert(
                    "Producto agregado correctamente."
                );
            }

            cancelar();

            await cargarProductos();

        } catch (error) {

            setSubiendoImagen(false);

            console.error(
                "Error guardando producto:",
                error
            );

            alert(
                "Ocurrió un error al guardar el producto."
            );
        }
    }

    async function borrar(id) {

        if (!window.confirm("¿Eliminar este producto?")) {
            return;
        }

        try {

            const resultado =
                await eliminarProducto(id);

            if (!resultado.ok) {

                alert(
                    resultado.mensaje ||
                    "No se pudo eliminar el producto."
                );

                return;
            }

            await cargarProductos();

        } catch (error) {

            console.error(
                "Error eliminando producto:",
                error
            );

            alert(
                "No se pudo eliminar el producto."
            );
        }
    }

    const productosFiltrados =
        productos.filter((producto) => {

            const nombre =
                producto.nombre?.toLowerCase() || "";

            const categoria =
                producto.categoria?.toLowerCase() || "";

            const texto =
                busqueda.toLowerCase();

            return (
                nombre.includes(texto) ||
                categoria.includes(texto)
            );
        });

    return (

        <section className="productTable">

            <div className="productHeader">

                <div>

                    <h2>
                        Productos Cargados
                    </h2>

                    <p>
                        Administrá los productos
                        de RC Conversiones.
                    </p>

                </div>

                <button
                    className="newProductBtn"
                    onClick={nuevoProducto}
                >
                    + Nuevo producto
                </button>

            </div>

            <input
                className="searchInput"
                type="text"
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={(e) =>
                    setBusqueda(e.target.value)
                }
            />

            {mostrarFormulario && (

                <form
                    className="productForm"
                    onSubmit={guardarProducto}
                >

                    <h3>
                        {editando
                            ? "Editar producto"
                            : "Nuevo producto"}
                    </h3>

                    <div className="formGrid">

                        <div className="formGroup">

                            <label>
                                Nombre
                            </label>

                            <input
                                name="nombre"
                                value={formulario.nombre}
                                onChange={cambiarCampo}
                                placeholder="Ej: Heladera 12/24V"
                                required
                            />

                        </div>

                        <div className="formGroup">

                            <label>
                                Categoría
                            </label>

                            <input
                                name="categoria"
                                value={formulario.categoria}
                                onChange={cambiarCampo}
                                placeholder="Ej: Heladeras"
                            />

                        </div>

                        <div className="formGroup">

                            <label>
                                Precio
                            </label>

                            <input
                                name="precio"
                                type="number"
                                min="0"
                                value={formulario.precio}
                                onChange={cambiarCampo}
                                placeholder="450000"
                            />

                        </div>

                        <div className="formGroup">

                            <label>
                                Stock
                            </label>

                            <input
                                name="stock"
                                type="number"
                                min="0"
                                value={formulario.stock}
                                onChange={cambiarCampo}
                                placeholder="5"
                            />

                        </div>

                    </div>

                    <div className="formGroup">

                        <label>
                            Descripción
                        </label>

                        <textarea
                            name="descripcion"
                            value={formulario.descripcion}
                            onChange={cambiarCampo}
                            placeholder="Descripción del producto..."
                            rows="4"
                        />

                    </div>

                    <div className="formGroup">

                        <label>
                            Foto del producto
                        </label>

                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(e) => {

                                const archivo =
                                    e.target.files?.[0];

                                setImagenFile(
                                    archivo || null
                                );

                            }}
                        />

                        {imagenFile && (

                            <p className="selectedFile">
                                📷 {imagenFile.name}
                            </p>

                        )}

                        {formulario.imagen && !imagenFile && (

                            <div className="currentImage">

                                <p>
                                    Imagen actual:
                                </p>

                                <img
                                    src={
                                        formulario.imagen.startsWith("http")
                                            ? formulario.imagen
                                            : `${API}${formulario.imagen}`
                                    }
                                    alt="Imagen actual"
                                />

                            </div>

                        )}

                    </div>

                    <label className="featuredCheck">

                        <input
                            type="checkbox"
                            checked={
                                Number(formulario.destacado) === 1
                            }
                            onChange={(e) =>
                                setFormulario((prev) => ({
                                    ...prev,
                                    destacado:
                                        e.target.checked ? 1 : 0
                                }))
                            }
                        />

                        Producto destacado

                    </label>

                    <div className="formButtons">

                        <button
                            type="submit"
                            className="saveBtn"
                            disabled={subiendoImagen}
                        >

                            {subiendoImagen
                                ? "Subiendo imagen..."
                                : editando
                                    ? "Guardar cambios"
                                    : "Agregar producto"}

                        </button>

                        <button
                            type="button"
                            className="cancelBtn"
                            onClick={cancelar}
                        >
                            Cancelar
                        </button>

                    </div>

                </form>

            )}

            <div className="tableContainer">

                <table>

                    <thead>

                        <tr>

                            <th>ID</th>
                            <th>Imagen</th>
                            <th>Nombre</th>
                            <th>Categoría</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Acciones</th>

                        </tr>

                    </thead>

                    <tbody>

                        {productosFiltrados.map(
                            (producto) => {

                                const imagen =
                                    producto.imagen;

                                return (

                                    <tr
                                        key={producto.id}
                                    >

                                        <td>
                                            {producto.id}
                                        </td>

                                        <td>

                                            {imagen ? (

                                                <img
                                                    className="productImage"
                                                    src={
                                                        imagen.startsWith("http")
                                                            ? imagen
                                                            : `${API}${imagen}`
                                                    }
                                                    alt={
                                                        producto.nombre
                                                    }
                                                />

                                            ) : (

                                                <div className="noImage">
                                                    Sin foto
                                                </div>

                                            )}

                                        </td>

                                        <td>
                                            {producto.nombre}
                                        </td>

                                        <td>
                                            {producto.categoria}
                                        </td>

                                        <td>
                                            $
                                            {Number(
                                                producto.precio
                                            ).toLocaleString(
                                                "es-AR"
                                            )}
                                        </td>

                                        <td>
                                            {producto.stock}
                                        </td>

                                        <td>

                                            <button
                                                className="editBtn"
                                                onClick={() =>
                                                    editar(producto)
                                                }
                                            >
                                                Editar
                                            </button>

                                            <button
                                                className="deleteBtn"
                                                onClick={() =>
                                                    borrar(
                                                        producto.id
                                                    )
                                                }
                                            >
                                                Eliminar
                                            </button>

                                        </td>

                                    </tr>

                                );
                            }
                        )}

                    </tbody>

                </table>

            </div>

        </section>
    );
}