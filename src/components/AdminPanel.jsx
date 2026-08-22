import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/AdminPanel.css";

import {
    agregarProducto,
    subirImagen
} from "../services/api";

import ProductTable from "./ProductTable";
import Presupuestos from "./Presupuestos";

export default function AdminPanel() {

    const navigate = useNavigate();

    const [producto, setProducto] = useState({

        nombre: "",
        categoria: "Heladeras",
        precio: "",
        stock: "",
        descripcion: "",
        imagen: "",
        destacado: true

    });

    const [archivo, setArchivo] =
        useState(null);

    const [guardando, setGuardando] =
        useState(false);


    // ============================
    // CAMBIAR PRODUCTO
    // ============================

    const cambiar = (e) => {

        setProducto({

            ...producto,

            [e.target.name]:
                e.target.value

        });

    };


    // ============================
    // SELECCIONAR IMAGEN
    // ============================

    function seleccionarImagen(e) {

        setArchivo(
            e.target.files[0] || null
        );

    }


    // ============================
    // GUARDAR PRODUCTO
    // ============================

    const guardar = async (e) => {

        e.preventDefault();

        try {

            setGuardando(true);

            let rutaImagen = "";


            if (archivo) {

                const subida =
                    await subirImagen(
                        archivo
                    );

                rutaImagen =
                    subida.ruta;

            }


            const nuevoProducto = {

                ...producto,

                precio:
                    Number(
                        producto.precio
                    ),

                stock:
                    Number(
                        producto.stock
                    ),

                destacado:
                    Boolean(
                        producto.destacado
                    ),

                imagen:
                    rutaImagen

            };


            const respuesta =
                await agregarProducto(
                    nuevoProducto
                );


            alert(
                respuesta.mensaje ||
                "Producto agregado correctamente."
            );


            // LIMPIAR FORMULARIO

            setProducto({

                nombre: "",
                categoria: "Heladeras",
                precio: "",
                stock: "",
                descripcion: "",
                imagen: "",
                destacado: true

            });


            setArchivo(null);


            // Limpiar input de archivo

            const inputArchivo =
                document.querySelector(
                    'input[type="file"]'
                );

            if (inputArchivo) {

                inputArchivo.value = "";

            }


        } catch (error) {

            console.error(
                "Error guardando producto:",
                error
            );

            alert(
                "No se pudo guardar el producto."
            );

        } finally {

            setGuardando(false);

        }

    };


    // ============================
    // CERRAR SESIÓN
    // ============================

    function cerrarSesion() {

        localStorage.removeItem(
            "admin"
        );

        window.location.href =
            "/login";

    }


    return (

        <section className="admin">


            {/* ============================
                CABECERA
            ============================ */}

            <div className="adminHeader">

                <div>

                    <h2>
                        Panel de Administración
                    </h2>

                    <p className="adminSubtitle">
                        Gestioná productos,
                        clientes y presupuestos.
                    </p>

                </div>


                <button
                    className="logout"
                    onClick={cerrarSesion}
                >

                    Cerrar sesión

                </button>

            </div>


            {/* ============================
                NAVEGACIÓN ADMIN
            ============================ */}

            <div className="adminNavigation">

                <button
                    type="button"
                    onClick={() =>
                        window.scrollTo({
                            top: 0,
                            behavior: "smooth"
                        })
                    }
                >

                    📦 Productos

                </button>


                <button
                    type="button"
                    onClick={() =>
                        document
                            .getElementById(
                                "presupuestos"
                            )
                            ?.scrollIntoView({
                                behavior: "smooth"
                            })
                    }
                >

                    📋 Presupuestos

                </button>


                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            "/admin/clientes"
                        )
                    }
                >

                    👥 Clientes

                </button>

            </div>


            {/* ============================
                AGREGAR PRODUCTO
            ============================ */}

            <div className="adminSection">

                <div className="adminSectionHeader">

                    <div>

                        <h3>
                            Agregar producto
                        </h3>

                        <p>
                            Cargá un nuevo producto
                            al catálogo.
                        </p>

                    </div>

                </div>


                <form
                    className="adminForm"
                    onSubmit={guardar}
                >


                    <input
                        type="text"
                        name="nombre"
                        placeholder="Nombre"
                        value={
                            producto.nombre
                        }
                        onChange={cambiar}
                        required
                    />


                    <select
                        name="categoria"
                        value={
                            producto.categoria
                        }
                        onChange={cambiar}
                    >

                        <option>
                            Heladeras
                        </option>

                        <option>
                            Energía Solar
                        </option>

                        <option>
                            Baterías
                        </option>

                        <option>
                            Reguladores
                        </option>

                        <option>
                            Inversores
                        </option>

                        <option>
                            Calefacción
                        </option>

                        <option>
                            Grifería
                        </option>

                        <option>
                            Accesorios
                        </option>

                    </select>


                    <input
                        type="number"
                        name="precio"
                        placeholder="Precio"
                        value={
                            producto.precio
                        }
                        onChange={cambiar}
                        min="0"
                        step="0.01"
                        required
                    />


                    <input
                        type="number"
                        name="stock"
                        placeholder="Stock"
                        value={
                            producto.stock
                        }
                        onChange={cambiar}
                        min="0"
                        required
                    />


                    <textarea
                        name="descripcion"
                        placeholder="Descripción"
                        value={
                            producto.descripcion
                        }
                        onChange={cambiar}
                        rows="4"
                    />


                    <label className="imagenLabel">

                        Imagen del producto

                        <input
                            type="file"
                            accept="image/*"
                            onChange={
                                seleccionarImagen
                            }
                        />

                    </label>


                    <label className="destacadoCheck">

                        <input
                            type="checkbox"
                            checked={
                                producto.destacado
                            }
                            onChange={(e) =>
                                setProducto({

                                    ...producto,

                                    destacado:
                                        e.target.checked

                                })
                            }
                        />

                        Producto destacado

                    </label>


                    <button
                        type="submit"
                        disabled={guardando}
                    >

                        {guardando
                            ? "Guardando..."
                            : "Guardar Producto"
                        }

                    </button>

                </form>

            </div>


            {/* ============================
                PRODUCTOS
            ============================ */}

            <div className="adminSection">

                <div className="adminSectionHeader">

                    <h3>
                        Productos
                    </h3>

                    <p>
                        Productos actualmente
                        cargados en la tienda.
                    </p>

                </div>


                <ProductTable />

            </div>


            {/* ============================
                PRESUPUESTOS
            ============================ */}

            <div
                className="adminSection"
                id="presupuestos"
            >

                <div className="adminSectionHeader">

                    <h3>
                        Presupuestos
                    </h3>

                    <p>
                        Solicitudes realizadas
                        por los clientes.
                    </p>

                </div>


                <Presupuestos />

            </div>


            {/* ============================
                CLIENTES
            ============================ */}

            <div className="adminClientesAccess">

                <div>

                    <h3>
                        👥 Clientes
                    </h3>

                    <p>
                        Consultá los clientes
                        registrados y su historial
                        de presupuestos.
                    </p>

                </div>


                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            "/admin/clientes"
                        )
                    }
                >

                    Ver clientes

                </button>

            </div>


        </section>

    );

}