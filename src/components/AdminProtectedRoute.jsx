import {
    useEffect,
    useState
} from "react";

import {
    Navigate
} from "react-router-dom";

const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export default function AdminProtectedRoute({
    children
}) {

    const [verificando, setVerificando] =
        useState(true);

    const [sesionValida, setSesionValida] =
        useState(false);

    useEffect(() => {

        let activo = true;

        async function verificarSesion() {

            const token =
                localStorage.getItem(
                    "admin_token"
                );

            const administrador =
                localStorage.getItem(
                    "administrador"
                );

            if (
                !token ||
                !administrador
            ) {
                localStorage.removeItem(
                    "admin_token"
                );
                localStorage.removeItem(
                    "administrador"
                );

                if (activo) {
                    setSesionValida(false);
                    setVerificando(false);
                }

                return;
            }

            try {

                const response = await fetch(
                    `${API}/admin/validar-token`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

                const datos =
                    await response.json();

                if (
                    !response.ok ||
                    !datos?.ok
                ) {
                    throw new Error(
                        datos?.mensaje ||
                        "Sesión inválida."
                    );
                }

                if (activo) {
                    setSesionValida(true);
                }

            } catch (error) {

                console.error(
                    "Sesión admin inválida:",
                    error
                );

                localStorage.removeItem(
                    "admin_token"
                );

                localStorage.removeItem(
                    "administrador"
                );

                if (activo) {
                    setSesionValida(false);
                }

            } finally {

                if (activo) {
                    setVerificando(false);
                }
            }
        }

        verificarSesion();

        return () => {
            activo = false;
        };

    }, []);


    if (verificando) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "Arial, sans-serif",
                    color: "#475569"
                }}
            >
                Verificando sesión...
            </div>
        );
    }

    if (!sesionValida) {
        return (
            <Navigate
                to="/admin/login"
                replace
            />
        );
    }

    return children;
}
