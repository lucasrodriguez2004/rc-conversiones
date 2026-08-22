import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/AdminClientes.css";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");


export default function AdminClientes() {

    const navigate = useNavigate();

    const [clientes, setClientes] =
        useState([]);

    const [busqueda, setBusqueda] =
        useState("");

    const [cargando, setCargando] =
        useState(true);

    const [error, setError] =
        useState("");


    // ============================
    // CARGAR CLIENTES
    // ============================

    async function cargarClientes() {

        try {

            setCargando(true);
            setError("");

            const response = await fetch(
                `${API}/admin/clientes`
            );

            const datos =
                await response.json();


            if (!response.ok || !datos.ok) {

                throw new Error(
                    datos.mensaje ||
                    "No se pudieron cargar los clientes."
                );

            }


            setClientes(
                datos.clientes || []
            );


        } catch (err) {

            console.error(
                "Error cargando clientes:",
                err
            );

            setError(
                err.message ||
                "No se pudo conectar con el servidor."
            );


        } finally {

            setCargando(false);

        }

    }


    // ============================
    // CARGAR AL ENTRAR
    // ============================

    useEffect(() => {

        cargarClientes();

    }, []);


    // ============================
    // BUSCADOR
    // ============================

    const clientesFiltrados =
        clientes.filter((cliente) => {

            const texto =
                busqueda
                    .toLowerCase()
                    .trim();


            if (!texto) {

                return true;

            }


            return (

                cliente.nombre
                    ?.toLowerCase()
                    .includes(texto)

                ||

                cliente.email
                    ?.toLowerCase()
                    .includes(texto)

                ||

                cliente.telefono
                    ?.toLowerCase()
                    .includes(texto)

            );

        });


    // ============================
    // CARGANDO
    // ============================

    if (cargando) {

        return (

            <section className="adminClientes">

                <div className="adminClientesHeader">

                    <div>

                        <h1>
                            Clientes
                        </h1>

                        <p>
                            Administrá los clientes
                            registrados en RC Conversiones.
                        </p>

                    </div>

                </div>


                <div className="sinClientes">

                    <h2>
                        Cargando clientes...
                    </h2>

                    <p>
                        Estamos obteniendo la
                        información de los clientes.
                    </p>

                </div>

            </section>

        );

    }


    // ============================
    // PÁGINA
    // ============================

    return (

        <section className="adminClientes">


            {/* ============================
                CABECERA
            ============================ */}

            <div className="adminClientesHeader">

                <div>

                    <h1>
                        Clientes
                    </h1>

                    <p>
                        Administrá los clientes registrados
                        en RC Conversiones.
                    </p>

                </div>


                <div className="cantidadClientes">

                    {clientes.length}

                    <span>
                        clientes
                    </span>

                </div>

            </div>


            {/* ============================
                ERROR
            ============================ */}

            {error && (

                <div className="clientesError">

                    {error}

                </div>

            )}


            {/* ============================
                BUSCADOR
            ============================ */}

            <div className="clientesBuscador">

                <input
                    type="text"
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={busqueda}
                    onChange={(e) =>
                        setBusqueda(
                            e.target.value
                        )
                    }
                />

            </div>


            {/* ============================
                SIN RESULTADOS
            ============================ */}

            {clientesFiltrados.length === 0 ? (

                <div className="sinClientes">

                    <h2>
                        {clientes.length === 0
                            ? "No hay clientes registrados"
                            : "No encontramos clientes"
                        }
                    </h2>

                    <p>

                        {clientes.length === 0
                            ? "Todavía no hay cuentas creadas."
                            : "Probá con otro nombre, email o teléfono."
                        }

                    </p>

                </div>

            ) : (

                /* ============================
                   TABLA DE CLIENTES
                ============================ */

                <div className="clientesTabla">


                    {/* CABECERA */}

                    <div className="clientesTablaHeader">

                        <span>
                            Cliente
                        </span>

                        <span>
                            Email
                        </span>

                        <span>
                            Teléfono
                        </span>

                        <span>
                            Registro
                        </span>

                        <span>
                            Estado
                        </span>

                        <span>
                            Acción
                        </span>

                    </div>


                    {/* CLIENTES */}

                    {clientesFiltrados.map(
                        (cliente) => (

                            <div
                                className="clienteFila"
                                key={cliente.id}
                            >


                                {/* CLIENTE */}

                                <div className="clienteNombre">

                                    <div className="clienteMiniAvatar">

                                        {cliente.nombre
                                            ?.charAt(0)
                                            ?.toUpperCase()}

                                    </div>


                                    <div>

                                        <strong>
                                            {cliente.nombre}
                                        </strong>

                                        <small>
                                            Cliente #{cliente.id}
                                        </small>

                                    </div>

                                </div>


                                {/* EMAIL */}

                                <span>

                                    {cliente.email ||
                                        "Sin email"}

                                </span>


                                {/* TELÉFONO */}

                                <span>

                                    {cliente.telefono ||
                                        "Sin teléfono"}

                                </span>


                                {/* FECHA */}

                                <span>

                                    {cliente.fecha_registro

                                        ? new Date(
                                            cliente.fecha_registro
                                        ).toLocaleDateString(
                                            "es-AR"
                                        )

                                        : "Sin fecha"

                                    }

                                </span>


                                {/* ESTADO */}

                                <span>

                                    {Number(
                                        cliente.verificado
                                    ) === 1 ? (

                                        <span
                                            className="estadoVerificado"
                                        >

                                            ✓ Verificado

                                        </span>

                                    ) : (

                                        <span
                                            className="estadoPendiente"
                                        >

                                            Pendiente

                                        </span>

                                    )}

                                </span>


                                {/* ACCIÓN */}

                                <button
                                    type="button"
                                    className="verCliente"
                                    onClick={() =>
                                        navigate(
                                            `/admin/clientes/${cliente.id}`
                                        )
                                    }
                                >

                                    Ver cliente

                                </button>


                            </div>

                        )
                    )}

                </div>

            )}


        </section>

    );

}