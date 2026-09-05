import {
    useCallback,
    useEffect,
    useState
} from "react";

import {
    Navigate
} from "react-router-dom";


const API =
    (
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000"
    )
        .trim()
        .replace(/\/+$/, "");


function limpiarSesionAdmin() {

    localStorage.removeItem(
        "admin_token"
    );

    localStorage.removeItem(
        "administrador"
    );

}


export default function AdminProtectedRoute({
    children
}) {

    const [verificando, setVerificando] =
        useState(true);

    const [sesionValida, setSesionValida] =
        useState(false);

    const [errorServidor, setErrorServidor] =
        useState("");


    const verificarSesion =
        useCallback(
            async (
                signal = undefined
            ) => {

                const token =
                    localStorage.getItem(
                        "admin_token"
                    );

                const administradorGuardado =
                    localStorage.getItem(
                        "administrador"
                    );


                // ==========================================
                // NO HAY SESIÓN LOCAL
                // ==========================================

                if (
                    !token ||
                    !administradorGuardado
                ) {

                    limpiarSesionAdmin();

                    setSesionValida(false);
                    setErrorServidor("");
                    setVerificando(false);

                    return;
                }


                // ==========================================
                // VALIDAR JSON LOCAL
                // ==========================================

                try {

                    JSON.parse(
                        administradorGuardado
                    );

                } catch {

                    limpiarSesionAdmin();

                    setSesionValida(false);
                    setErrorServidor("");
                    setVerificando(false);

                    return;
                }


                try {

                    setVerificando(true);
                    setErrorServidor("");


                    const response =
                        await fetch(
                            `${API}/admin/validar-token`,
                            {
                                method: "GET",

                                headers: {
                                    Accept:
                                        "application/json",

                                    Authorization:
                                        `Bearer ${token}`
                                },

                                signal
                            }
                        );


                    // ==========================================
                    // TOKEN REALMENTE INVÁLIDO
                    // ==========================================

                    if (
                        response.status === 401 ||
                        response.status === 403
                    ) {

                        limpiarSesionAdmin();

                        setSesionValida(false);
                        setErrorServidor("");

                        return;
                    }


                    // ==========================================
                    // ERROR DEL SERVIDOR
                    // NO BORRAMOS LA SESIÓN
                    // ==========================================

                    if (!response.ok) {

                        throw new Error(
                            `El servidor respondió HTTP ${response.status}.`
                        );

                    }


                    const contentType =
                        response.headers.get(
                            "content-type"
                        ) || "";


                    if (
                        !contentType.includes(
                            "application/json"
                        )
                    ) {

                        throw new Error(
                            "El servidor devolvió una respuesta inesperada."
                        );

                    }


                    const datos =
                        await response.json();


                    if (
                        !datos?.ok ||
                        !datos?.administrador
                    ) {

                        limpiarSesionAdmin();

                        setSesionValida(false);
                        setErrorServidor("");

                        return;
                    }


                    // ==========================================
                    // SESIÓN CORRECTA
                    // REFRESCAMOS DATOS DEL ADMIN
                    // ==========================================

                    localStorage.setItem(
                        "administrador",
                        JSON.stringify(
                            datos.administrador
                        )
                    );

                    setSesionValida(true);
                    setErrorServidor("");


                } catch (error) {

                    if (
                        error?.name ===
                        "AbortError"
                    ) {

                        return;
                    }


                    console.error(
                        "No se pudo validar la sesión admin:",
                        error
                    );


                    /*
                        IMPORTANTE:

                        Si Railway está reiniciando,
                        internet se corta o la API
                        temporalmente no responde,
                        NO eliminamos el JWT.

                        Solo cerramos sesión cuando
                        el backend responde 401/403
                        o confirma que el token
                        no es válido.
                    */

                    setSesionValida(false);

                    setErrorServidor(
                        "No se pudo conectar con el servidor para validar la sesión."
                    );


                } finally {

                    setVerificando(false);

                }

            },
            []
        );


    useEffect(() => {

        const controller =
            new AbortController();


        verificarSesion(
            controller.signal
        );


        return () => {

            controller.abort();

        };

    }, [
        verificarSesion
    ]);


    // ==========================================
    // VALIDANDO
    // ==========================================

    if (verificando) {

        return (

            <div
                style={{
                    minHeight: "100vh",
                    display: "grid",
                    placeItems: "center",
                    fontFamily:
                        "Arial, sans-serif",
                    color:
                        "#475569",
                    background:
                        "#f8fafc"
                }}
            >

                <div
                    style={{
                        textAlign: "center"
                    }}
                >

                    <strong>
                        Verificando sesión...
                    </strong>

                    <div
                        style={{
                            marginTop: "8px",
                            fontSize: "14px",
                            color: "#64748b"
                        }}
                    >
                        RC Conversiones
                    </div>

                </div>

            </div>

        );

    }


    // ==========================================
    // ERROR DE CONEXIÓN
    // CONSERVAMOS LA SESIÓN LOCAL
    // ==========================================

    if (
        errorServidor &&
        !sesionValida
    ) {

        return (

            <div
                style={{
                    minHeight: "100vh",
                    display: "grid",
                    placeItems: "center",
                    padding: "24px",
                    fontFamily:
                        "Arial, sans-serif",
                    background:
                        "#f8fafc"
                }}
            >

                <div
                    style={{
                        width: "100%",
                        maxWidth: "460px",
                        padding: "28px",
                        borderRadius: "16px",
                        background: "#ffffff",
                        border:
                            "1px solid #e2e8f0",
                        boxShadow:
                            "0 12px 35px rgba(15, 23, 42, 0.08)",
                        textAlign: "center"
                    }}
                >

                    <h2
                        style={{
                            marginTop: 0,
                            color: "#0f172a"
                        }}
                    >
                        No pudimos validar tu sesión
                    </h2>

                    <p
                        style={{
                            color: "#64748b",
                            lineHeight: 1.6
                        }}
                    >
                        {errorServidor}
                    </p>

                    <p
                        style={{
                            color: "#64748b",
                            fontSize: "14px"
                        }}
                    >
                        Tu sesión no fue eliminada.
                        Puede ser un reinicio temporal
                        de Railway o un problema de conexión.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            verificarSesion()
                        }
                        style={{
                            marginTop: "10px",
                            border: 0,
                            borderRadius: "10px",
                            padding:
                                "12px 18px",
                            fontWeight: 700,
                            cursor: "pointer",
                            background:
                                "#0d8cff",
                            color: "#ffffff"
                        }}
                    >
                        Reintentar
                    </button>

                </div>

            </div>

        );

    }


    // ==========================================
    // TOKEN INVÁLIDO / SIN LOGIN
    // ==========================================

    if (!sesionValida) {

        return (

            <Navigate
                to="/admin/login"
                replace
            />

        );

    }


    // ==========================================
    // SESIÓN ADMIN VÁLIDA
    // ==========================================

    return children;

}
