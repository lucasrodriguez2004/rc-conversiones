import { useEffect, useState } from "react";

import {
    obtenerPresupuestos,
    actualizarEstadoPresupuesto
} from "../services/api";

import "../styles/Presupuestos.css";

const ESTADOS = [
    "Pendiente",
    "Contactado",
    "En revisión",
    "Aprobado",
    "Rechazado"
];

export default function Presupuestos() {

    const [presupuestos, setPresupuestos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [actualizando, setActualizando] = useState(null);

    useEffect(() => {

        cargarPresupuestos();

    }, []);

    async function cargarPresupuestos() {

        try {

            setCargando(true);

            const datos =
                await obtenerPresupuestos();

            if (Array.isArray(datos)) {

                setPresupuestos(datos);

            } else if (
                datos &&
                Array.isArray(datos.presupuestos)
            ) {

                setPresupuestos(
                    datos.presupuestos
                );

            } else {

                setPresupuestos([]);

            }

        } catch (error) {

            console.error(
                "Error obteniendo presupuestos:",
                error
            );

            alert(
                "No se pudieron cargar los tickets."
            );

            setPresupuestos([]);

        } finally {

            setCargando(false);

        }

    }

    async function cambiarEstado(
        id,
        nuevoEstado
    ) {

        try {

            setActualizando(id);

            await actualizarEstadoPresupuesto(
                id,
                nuevoEstado
            );

            setPresupuestos(
                actuales =>
                    actuales.map(
                        presupuesto =>
                            presupuesto.id === id
                                ? {
                                    ...presupuesto,
                                    estado: nuevoEstado
                                }
                                : presupuesto
                    )
            );

        } catch (error) {

            console.error(
                "Error cambiando estado:",
                error
            );

            alert(
                error.message ||
                "No se pudo actualizar el estado."
            );

        } finally {

            setActualizando(null);

        }

    }

    function claseEstado(estado) {

        switch (estado) {

            case "Aprobado":
                return "estado aprobado";

            case "Rechazado":
                return "estado rechazado";

            case "En revisión":
                return "estado revision";

            case "Contactado":
                return "estado contactado";

            default:
                return "estado pendiente";

        }

    }

    function formatearFecha(fecha) {

        if (!fecha) {
            return "-";
        }

        const fechaObj =
            new Date(fecha);

        if (
            Number.isNaN(
                fechaObj.getTime()
            )
        ) {
            return "-";
        }

        return fechaObj.toLocaleString(
            "es-AR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }

    if (cargando) {

        return (

            <section className="presupuestos">

                <div className="presupuestosHeader">

                    <div>

                        <h2>
                            Tickets
                        </h2>

                        <p>
                            Solicitudes recibidas
                            de los clientes.
                        </p>

                    </div>

                </div>

                <div className="sinPresupuestos">

                    <p>
                        Cargando tickets...
                    </p>

                </div>

            </section>

        );

    }

    return (

        <section className="presupuestos">

            <div className="presupuestosHeader">

                <div>

                    <h2>
                        Tickets
                    </h2>

                    <p>
                        Solicitudes recibidas
                        de los clientes.
                    </p>

                </div>

                <button
                    className="actualizar"
                    onClick={cargarPresupuestos}
                    type="button"
                >
                    Actualizar
                </button>

            </div>

            {presupuestos.length === 0 ? (

                <div className="sinPresupuestos">

                    <h3>
                        No hay tickets todavía
                    </h3>

                    <p>
                        Cuando un cliente solicite
                        un presupuesto, aparecerá aquí.
                    </p>

                </div>

            ) : (

                <div className="presupuestosTabla">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Código
                                </th>

                                <th>
                                    Cliente
                                </th>

                                <th>
                                    Teléfono
                                </th>

                                <th>
                                    Total
                                </th>

                                <th>
                                    Estado
                                </th>

                                <th>
                                    Fecha
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {presupuestos.map(
                                presupuesto => {

                                    const estado =
                                        presupuesto.estado ||
                                        "Pendiente";

                                    return (

                                        <tr
                                            key={
                                                presupuesto.id
                                            }
                                        >

                                            <td>

                                                <strong>
                                                    {
                                                        presupuesto.codigo
                                                    }
                                                </strong>

                                            </td>

                                            <td>
                                                {
                                                    presupuesto.cliente
                                                }
                                            </td>

                                            <td>
                                                {
                                                    presupuesto.telefono ||
                                                    "-"
                                                }
                                            </td>

                                            <td>

                                                $
                                                {Number(
                                                    presupuesto.total ||
                                                    0
                                                ).toLocaleString(
                                                    "es-AR"
                                                )}

                                            </td>

                                            <td>

                                                <div className="estadoContainer">

                                                    <span
                                                        className={
                                                            claseEstado(
                                                                estado
                                                            )
                                                        }
                                                    >
                                                        {estado}
                                                    </span>

                                                    <select
                                                        value={estado}
                                                        disabled={
                                                            actualizando ===
                                                            presupuesto.id
                                                        }
                                                        onChange={e =>
                                                            cambiarEstado(
                                                                presupuesto.id,
                                                                e.target.value
                                                            )
                                                        }
                                                    >

                                                        {ESTADOS.map(
                                                            estadoDisponible => (

                                                                <option
                                                                    key={
                                                                        estadoDisponible
                                                                    }
                                                                    value={
                                                                        estadoDisponible
                                                                    }
                                                                >
                                                                    {
                                                                        estadoDisponible
                                                                    }
                                                                </option>

                                                            )
                                                        )}

                                                    </select>

                                                </div>

                                            </td>

                                            <td>
                                                {
                                                    formatearFecha(
                                                        presupuesto.fecha
                                                    )
                                                }
                                            </td>

                                        </tr>

                                    );

                                }
                            )}

                        </tbody>

                    </table>

                </div>

            )}

        </section>

    );

}