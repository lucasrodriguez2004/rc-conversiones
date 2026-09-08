import {
    NavLink,
    useNavigate
} from "react-router-dom";

import "../styles/AdminLayout.css";

export default function AdminLayout({
    children
}) {

    const navigate = useNavigate();


    function cerrarSesion() {

        localStorage.removeItem(
            "admin_token"
        );

        localStorage.removeItem(
            "administrador"
        );

        navigate(
            "/admin/login",
            {
                replace: true
            }
        );

    }


    return (

        <div className="adminLayout">

            <header className="adminTopNav">

                <div className="adminTopBrand">
                    <strong>
                        RC Conversiones
                    </strong>
                    <span>
                        Administración
                    </span>
                </div>


                <nav
                    className="adminTopLinks"
                    aria-label="Navegación administrativa"
                >

                    <NavLink
                        to="/admin"
                        end
                    >
                        Panel
                    </NavLink>

                    <NavLink
                        to="/admin/presupuestos"
                    >
                        Tickets
                    </NavLink>

                    <NavLink
                        to="/admin/clientes"
                    >
                        Clientes
                    </NavLink>

                    <NavLink
                        to="/admin/productos"
                    >
                        Productos / categorías
                    </NavLink>

                </nav>


                <div className="adminTopActions">

                    <button
                        type="button"
                        className="adminViewSite"
                        onClick={() =>
                            navigate("/")
                        }
                    >
                        Ver web
                    </button>

                    <button
                        type="button"
                        className="adminLogout"
                        onClick={
                            cerrarSesion
                        }
                    >
                        Cerrar sesión
                    </button>

                </div>

            </header>

            <main className="adminLayoutContent">
                {children}
            </main>

        </div>

    );

}
