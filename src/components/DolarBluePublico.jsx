import { useEffect, useState } from "react";

const DOLAR_URL = "https://dolarapi.com/v1/dolares/blue";
const STORAGE_KEY = "rc_dolar_blue_venta";
const ACTUALIZACION_MS = 5 * 60 * 1000;

function leerUltimoValor() {
    try {
        const guardado = localStorage.getItem(STORAGE_KEY);
        const numero = Number(guardado);

        return Number.isFinite(numero) && numero > 0
            ? numero
            : null;
    } catch {
        return null;
    }
}

function formatearValor(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return "—";
    }

    return "$" + new Intl.NumberFormat(
        "es-AR",
        { maximumFractionDigits: 0 }
    ).format(numero);
}

export default function DolarBluePublico() {
    const [venta, setVenta] = useState(leerUltimoValor);
    const [cargando, setCargando] = useState(!leerUltimoValor());

    useEffect(() => {
        let activo = true;

        async function cargarDolar() {
            try {
                const response = await fetch(
                    DOLAR_URL,
                    { cache: "no-store" }
                );

                if (!response.ok) {
                    throw new Error(
                        `DolarAPI respondió HTTP ${response.status}`
                    );
                }

                const data = await response.json();
                const nuevoValor = Number(data?.venta);

                if (!Number.isFinite(nuevoValor) || nuevoValor <= 0) {
                    throw new Error("Cotización inválida");
                }

                if (activo) {
                    setVenta(nuevoValor);
                    setCargando(false);
                }

                try {
                    localStorage.setItem(
                        STORAGE_KEY,
                        String(nuevoValor)
                    );
                } catch {}
            } catch (error) {
                console.warn(
                    "No se pudo actualizar el dólar blue:",
                    error.message
                );

                if (activo) {
                    setCargando(false);
                }
            }
        }

        cargarDolar();

        const intervalo = setInterval(
            cargarDolar,
            ACTUALIZACION_MS
        );

        return () => {
            activo = false;
            clearInterval(intervalo);
        };
    }, []);

    return (
        <div
            className="rcDolarPublico"
            title="Dólar blue - valor de venta"
            aria-label={
                venta
                    ? `Dólar blue venta ${formatearValor(venta)}`
                    : "Dólar blue sin datos"
            }
        >
            <span>Dólar blue</span>
            <strong>
                {cargando && !venta
                    ? "..."
                    : formatearValor(venta)}
            </strong>
        </div>
    );
}
