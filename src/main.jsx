import React from "react";
import ReactDOM from "react-dom/client";

import {
    BrowserRouter
} from "react-router-dom";

import App from "./App";

import "./styles/global.css";
import "./styles/rc-theme.css";

import {
    CartProvider
} from "./context/CartContext";


// =====================================================
// FETCH CON SESIONES SEGURAS
// =====================================================
//
// Conserva los fetch() existentes y agrega automáticamente
// el JWT correcto según la API que se esté llamando.

const API_ORIGIN = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const fetchOriginal =
    window.fetch.bind(window);


function obtenerDatosPeticion(
    input,
    init = {}
) {

    const urlTexto =
        typeof input === "string"
            ? input
            : input?.url || "";


    const metodo =
        String(
            init.method ||
            input?.method ||
            "GET"
        ).toUpperCase();


    try {

        const url =
            new URL(
                urlTexto,
                window.location.origin
            );


        return {
            url,
            metodo
        };


    } catch {

        return {
            url: null,
            metodo
        };

    }

}


// =====================================================
// DETERMINAR QUÉ SESIÓN NECESITA UNA API
// =====================================================

function tipoSesionParaPeticion(
    url,
    metodo
) {

    if (
        !url ||
        url.origin !== API_ORIGIN
    ) {

        return null;

    }


    const ruta =
        url.pathname;


    // ------------------------------------------
    // RUTAS PÚBLICAS
    // ------------------------------------------

    if (
        ruta === "/" ||
        ruta === "/login" ||
        ruta === "/clientes/login" ||
        ruta === "/clientes/registro" ||
        ruta.startsWith(
            "/clientes/verificar/"
        )
    ) {

        return null;

    }


    if (
        ruta === "/productos" &&
        metodo === "GET"
    ) {

        return null;

    }


    if (
        /^\/productos\/[^/]+$/.test(
            ruta
        ) &&
        metodo === "GET"
    ) {

        return null;

    }


    // ------------------------------------------
    // RUTAS DEL CLIENTE
    // ------------------------------------------

    if (
        ruta === "/clientes/me" ||
        (
            ruta === "/presupuestos" &&
            metodo === "POST"
        ) ||
        ruta.startsWith(
            "/presupuestos/cliente/"
        )
    ) {

        return "cliente";

    }


    // ------------------------------------------
    // RUTAS ADMINISTRATIVAS
    // ------------------------------------------

    if (
        ruta.startsWith(
            "/admin/"
        ) ||
        ruta.startsWith(
            "/presupuestos-admin"
        ) ||
        ruta === "/upload" ||
        ruta === "/vendedores"
    ) {

        return "admin";

    }


    if (
        ruta === "/productos" &&
        metodo !== "GET"
    ) {

        return "admin";

    }


    if (
        /^\/productos\/[^/]+$/.test(
            ruta
        ) &&
        metodo !== "GET"
    ) {

        return "admin";

    }


    if (
        /^\/presupuestos\/[^/]+\/(estado|nota|contacto|seguimiento)$/.test(
            ruta
        )
    ) {

        return "admin";

    }


    return null;

}


// =====================================================
// FETCH GLOBAL
// =====================================================

window.fetch =
    async function fetchConSesion(
        input,
        init = {}
    ) {

        const {
            url,
            metodo
        } =
            obtenerDatosPeticion(
                input,
                init
            );


        const tipoSesion =
            tipoSesionParaPeticion(
                url,
                metodo
            );


        if (!tipoSesion) {

            return fetchOriginal(
                input,
                init
            );

        }


        const token =
            localStorage.getItem(
                tipoSesion === "admin"
                    ? "admin_token"
                    : "cliente_token"
            );


        const headers =
            new Headers(
                init.headers ||
                input?.headers ||
                undefined
            );


        if (
            token &&
            !headers.has(
                "Authorization"
            )
        ) {

            headers.set(
                "Authorization",
                `Bearer ${token}`
            );

        }


        const response =
            await fetchOriginal(
                input,
                {
                    ...init,
                    headers
                }
            );


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            if (
                tipoSesion === "admin"
            ) {

                localStorage.removeItem(
                    "admin_token"
                );

                localStorage.removeItem(
                    "administrador"
                );


                if (
                    window.location.pathname.startsWith(
                        "/admin"
                    ) &&
                    window.location.pathname !==
                        "/admin/login"
                ) {

                    window.location.replace(
                        "/admin/login"
                    );

                }


            } else {

                localStorage.removeItem(
                    "cliente_token"
                );

                localStorage.removeItem(
                    "cliente"
                );

                localStorage.removeItem(
                    "ticket_recien_generado"
                );


                if (
                    window.location.pathname ===
                    "/mi-cuenta"
                ) {

                    window.location.replace(
                        "/login"
                    );

                }

            }

        }


        return response;

    };


ReactDOM.createRoot(
    document.getElementById("root")
).render(
    <BrowserRouter>
        <CartProvider>
            <App />
        </CartProvider>
    </BrowserRouter>
);
