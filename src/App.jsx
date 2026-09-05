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
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import CategoriaProductos from "./components/CategoriaProductos";

import AdminLogin from "./components/AdminLogin";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AdminDashboard from "./components/AdminDashboard";
import AdminPresupuestos from "./components/AdminPresupuestos";
import AdminPresupuestoDetalle from "./components/AdminPresupuestoDetalle";
import AdminClientes from "./components/AdminClientes";
import AdminClienteDetalle from "./components/AdminClienteDetalle";
import AdminCatalogo from "./components/AdminCatalogo";
import AdminProductosAutonomo from "./components/AdminProductosAutonomo";

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
            <Route path="/" element={<Inicio />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verificar/:codigo" element={<Verificar />} />
            <Route path="/mi-cuenta" element={<MiCuenta />} />
            <Route path="/olvide-contrasena" element={<ForgotPassword />} />
            <Route
                path="/restablecer-contrasena/:token"
                element={<ResetPassword />}
            />
            <Route
                path="/categoria/:slug"
                element={<CategoriaProductos />}
            />

            <Route
                path="/admin/login"
                element={<AdminLogin />}
            />

            <Route
                path="/admin"
                element={
                    <AdminProtectedRoute>
                        <AdminDashboard />
                    </AdminProtectedRoute>
                }
            />

            <Route
                path="/admin/productos"
                element={
                    <AdminProtectedRoute>
                        <AdminCatalogo />
                    </AdminProtectedRoute>
                }
            />

            <Route
                path="/admin/catalogo"
                element={
                    <AdminProtectedRoute>
                        <AdminCatalogo />
                    </AdminProtectedRoute>
                }
            />

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
        </Routes>
    );
}

export default App;
