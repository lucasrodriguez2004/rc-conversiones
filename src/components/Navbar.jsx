import "../styles/Navbar.css";

import {
    FaShoppingCart,
    FaUser,
    FaSearch
} from "react-icons/fa";

import { useNavigate, Link } from "react-router-dom";

import { useCart } from "../context/CartContext";


export default function Navbar({
    busqueda,
    setBusqueda,
    abrirCarrito
}) {

    const navigate = useNavigate();

    const { carrito } = useCart();


    // ==========================================
    // CLIENTE LOGUEADO
    // ==========================================

    const clienteGuardado =
        localStorage.getItem("cliente");

    let cliente = null;

    if (clienteGuardado) {

        try {

            cliente = JSON.parse(
                clienteGuardado
            );

        } catch {

            localStorage.removeItem(
                "cliente"
            );

        }

    }


    // ==========================================
    // CANTIDAD DEL CARRITO
    // ==========================================

    const cantidad = carrito.reduce(

        (total, item) =>
            total + Number(item.cantidad || 0),

        0

    );


    // ==========================================
    // CERRAR SESIÓN
    // ==========================================

    function cerrarSesion() {

        localStorage.removeItem(
            "cliente"
        );

        navigate("/login");

    }


    return (

        <header className="navbar">


            {/* ============================= */}
            {/* LOGO */}
            {/* ============================= */}

            <div className="logo">

                <Link to="/">

                    <img
                        src="/images/logo.png"
                        alt="RC Conversiones"
                    />

                </Link>

            </div>


            {/* ============================= */}
            {/* NAVEGACIÓN */}
            {/* ============================= */}

            <nav>

                <Link to="/">
                    Inicio
                </Link>

                <a href="#productos">
                    Productos
                </a>

                <a href="#categorias">
                    Categorías
                </a>

                <a href="#contacto">
                    Contacto
                </a>

            </nav>


            {/* ============================= */}
            {/* PARTE DERECHA */}
            {/* ============================= */}

            <div className="navbarRight">


                {/* ============================= */}
                {/* BUSCADOR */}
                {/* ============================= */}

                <div className="search">

                    <FaSearch />

                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={busqueda}
                        onChange={(e) =>
                            setBusqueda(
                                e.target.value
                            )
                        }
                    />

                </div>


                {/* ============================= */}
                {/* CARRITO */}
                {/* ============================= */}

                <button
                    className="cartIcon"
                    onClick={abrirCarrito}
                    type="button"
                    aria-label="Abrir carrito"
                >

                    <FaShoppingCart />

                    {cantidad > 0 && (

                        <span>
                            {cantidad}
                        </span>

                    )}

                </button>


                {/* ============================= */}
                {/* USUARIO */}
                {/* ============================= */}

                {cliente ? (

                    <div className="userMenu">


                        <Link
                            to="/mi-cuenta"
                            className="accountButton"
                        >

                            <FaUser />

                            <span>
                                {cliente.nombre}
                            </span>

                        </Link>


                        <button
                            className="logoutButton"
                            onClick={cerrarSesion}
                            type="button"
                        >

                            Salir

                        </button>


                    </div>

                ) : (

                    <button
                        className="login"
                        onClick={() =>
                            navigate("/login")
                        }
                        type="button"
                    >

                        <FaUser />

                        <span>
                            Ingresar
                        </span>

                    </button>

                )}

            </div>

        </header>

    );

}