import { useState } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Categories from "./components/Categories";

import FeaturedProducts from "./components/FeaturedProducts";
import WhyChooseUs from "./components/WhyChooseUs";
import Newsletter from "./components/Newsletter";
import Contact from "./components/Contact";
import About from "./components/About";
import Footer from "./components/Footer";
import Cart from "./components/Cart";
import WhatsAppButton from "./components/WhatsAppButton";

import Register from "./components/Register";
import Login from "./components/Login";
import Verificar from "./components/Verificar";
import MiCuenta from "./components/MiCuenta";

import AdminLogin from "./components/AdminLogin";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AdminDashboard from "./components/AdminDashboard";
import AdminPresupuestos from "./components/AdminPresupuestos";
import AdminPresupuestoDetalle from "./components/AdminPresupuestoDetalle";
import AdminClientes from "./components/AdminClientes";
import AdminClienteDetalle from "./components/AdminClienteDetalle";
import ProductTable from "./components/ProductTable";
import CategoriaProductos from "./components/CategoriaProductos";
function Inicio() {

    const [busqueda, setBusqueda] = useState("");
    const [carritoAbierto, setCarritoAbierto] = useState(false);

    return (
        <>
            <Navbar
                busqueda={busqueda}
                setBusqueda={setBusqueda}
                abrirCarrito={() => setCarritoAbierto(true)}
            />

            <Hero />

            <Categories />
            <FeaturedProducts />

            <WhyChooseUs />

            <Newsletter />

            <Contact />

            <About />

            <Footer />

            <Cart
                abierto={carritoAbierto}
                cerrar={() => setCarritoAbierto(false)}
            />

            <WhatsAppButton />
        </>
    );
}

function App() {

    return (
        <Routes>

            {/* ================================
                SITIO PÃšBLICO
            ================================= */}

            <Route
                path="/"
                element={<Inicio />}
            />

            <Route
                path="/registro"
                element={<Register />}
            />

            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/verificar/:codigo"
                element={<Verificar />}
            />

            <Route
                path="/mi-cuenta"
                element={<MiCuenta />}
            />


            {/* ================================
                LOGIN ADMIN
            ================================= */}

            <Route
                path="/admin/login"
                element={<AdminLogin />}
            />


            {/* ================================
                ADMIN DASHBOARD
            ================================= */}

            <Route
                path="/admin"
                element={
                    <AdminProtectedRoute>
                        <AdminDashboard />
                    </AdminProtectedRoute>
                }
            />


            {/* ================================
                ADMIN PRESUPUESTOS
            ================================= */}

            <Route
                path="/admin/presupuestos"
                element={
                    <AdminProtectedRoute>
                        <AdminPresupuestos />
                    </AdminProtectedRoute>
                }
            />

            <Route
                path="/admin/presupuestos/:id"
                element={
                    <AdminProtectedRoute>
                        <AdminPresupuestoDetalle />
                    </AdminProtectedRoute>
                }
            />


            {/* ================================
                ADMIN CLIENTES
            ================================= */}

            <Route
                path="/admin/clientes"
                element={
                    <AdminProtectedRoute>
                        <AdminClientes />
                    </AdminProtectedRoute>
                }
            />

            <Route
                path="/admin/clientes/:id"
                element={
                    <AdminProtectedRoute>
                        <AdminClienteDetalle />
                    </AdminProtectedRoute>
                }
            />

<Route
    path="/admin/productos"
    element={
        <AdminProtectedRoute>
            <ProductTable />
        </AdminProtectedRoute>
    }
/>
            <Route
        path="/categoria/:slug"
        element={<CategoriaProductos />}
    />
</Routes>
    );
}

export default App;

