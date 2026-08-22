const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

// =====================================================
// PRODUCTOS
// =====================================================

export async function obtenerProductos() {
    const response = await fetch(`${API}/productos`);

    const datos = await response.json();

    if (!response.ok) {
        throw new Error(
            datos.mensaje || "No se pudieron obtener los productos."
        );
    }

    return datos;
}


export async function agregarProducto(producto) {
    const response = await fetch(`${API}/productos`, {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(producto)
    });

    const datos = await response.json();

    if (!response.ok || !datos.ok) {
        throw new Error(
            datos.mensaje || "No se pudo agregar el producto."
        );
    }

    return datos;
}


export async function editarProducto(id, producto) {
    const response = await fetch(
        `${API}/productos/${id}`,
        {
            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(producto)
        }
    );

    const datos = await response.json();

    if (!response.ok || !datos.ok) {
        throw new Error(
            datos.mensaje || "No se pudo editar el producto."
        );
    }

    return datos;
}


export async function eliminarProducto(id) {
    const response = await fetch(
        `${API}/productos/${id}`,
        {
            method: "DELETE"
        }
    );

    const datos = await response.json();

    if (!response.ok || !datos.ok) {
        throw new Error(
            datos.mensaje || "No se pudo eliminar el producto."
        );
    }

    return datos;
}


// =====================================================
// IMÁGENES
// =====================================================

export async function subirImagen(file) {

    const formData = new FormData();

    formData.append("imagen", file);

    const response = await fetch(
        `${API}/upload`,
        {
            method: "POST",
            body: formData
        }
    );

    const datos = await response.json();

    if (!response.ok || !datos.ok) {
        throw new Error(
            datos.mensaje || "No se pudo subir la imagen."
        );
    }

    return datos;
}


// =====================================================
// LOGIN ADMINISTRADOR
// =====================================================

export async function loginAdministrador(
    usuario,
    password
) {

    const response = await fetch(
        `${API}/login`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                usuario,
                password
            })
        }
    );

    const datos = await response.json();

    if (!response.ok) {
        throw new Error(
            datos.mensaje || "Error al iniciar sesión."
        );
    }

    return datos;
}


// =====================================================
// VENDEDORES
// =====================================================

export async function obtenerVendedores() {

    const response = await fetch(
        `${API}/vendedores`
    );

    const datos = await response.json();

    if (!response.ok || !datos.ok) {
        throw new Error(
            datos.mensaje ||
            "No se pudieron obtener los vendedores."
        );
    }

    return datos.vendedores;
}


// =====================================================
// PRESUPUESTOS
// =====================================================

export async function guardarPresupuesto(datos) {

    const response = await fetch(
        `${API}/presupuestos`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(datos)
        }
    );

    const resultado =
        await response.json();

    if (
        !response.ok ||
        !resultado.ok
    ) {
        throw new Error(
            resultado.mensaje ||
            "No se pudo guardar el presupuesto."
        );
    }

    return resultado;
}


// =====================================================
// PRESUPUESTOS - ADMIN
// =====================================================

export async function obtenerPresupuestos() {

    const response = await fetch(
        `${API}/presupuestos-admin`
    );

    const datos =
        await response.json();

    if (
        !response.ok ||
        !datos.ok
    ) {
        throw new Error(
            datos.mensaje ||
            "No se pudieron obtener los presupuestos."
        );
    }

    return datos.presupuestos;
}


// =====================================================
// PRESUPUESTOS DE UN CLIENTE
// =====================================================

export async function obtenerPresupuestosCliente(
    clienteId
) {

    const response = await fetch(
        `${API}/presupuestos/cliente/${clienteId}`
    );

    const datos =
        await response.json();

    if (
        !response.ok ||
        !datos.ok
    ) {
        throw new Error(
            datos.mensaje ||
            "No se pudieron obtener los presupuestos del cliente."
        );
    }

    return datos.presupuestos;
}


// =====================================================
// DETALLE DE PRESUPUESTO
// =====================================================

export async function obtenerPresupuesto(id) {

    const response = await fetch(
        `${API}/presupuestos-admin/${id}`
    );

    const datos =
        await response.json();

    if (
        !response.ok ||
        !datos.ok
    ) {
        throw new Error(
            datos.mensaje ||
            "No se pudo obtener el presupuesto."
        );
    }

    return datos.presupuesto;
}


// =====================================================
// CAMBIAR ESTADO DEL PRESUPUESTO
// =====================================================

export async function actualizarEstadoPresupuesto(
    id,
    estado
) {

    const response = await fetch(
        `${API}/presupuestos/${id}/estado`,
        {
            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                estado
            })
        }
    );

    const datos =
        await response.json();

    if (
        !response.ok ||
        !datos.ok
    ) {
        throw new Error(
            datos.mensaje ||
            "No se pudo actualizar el estado."
        );
    }

    return datos;
}


// =====================================================
// CLIENTES - ADMIN
// =====================================================

export async function obtenerClientes() {

    const response = await fetch(
        `${API}/admin/clientes`
    );

    const datos =
        await response.json();

    if (
        !response.ok ||
        !datos.ok
    ) {
        throw new Error(
            datos.mensaje ||
            "No se pudieron obtener los clientes."
        );
    }

    return datos.clientes;
}


// =====================================================
// FICHA COMPLETA DE CLIENTE
// =====================================================

export async function obtenerCliente(id) {

    const response = await fetch(
        `${API}/admin/clientes/${id}`
    );

    const datos =
        await response.json();

    if (
        !response.ok ||
        !datos.ok
    ) {
        throw new Error(
            datos.mensaje ||
            "No se pudo obtener el cliente."
        );
    }

    return datos.cliente;
}


// =====================================================
// DASHBOARD ADMIN
// =====================================================

export async function obtenerDashboard() {

    const response = await fetch(
        `${API}/admin/dashboard`
    );

    const datos =
        await response.json();

    if (
        !response.ok ||
        !datos.ok
    ) {
        throw new Error(
            datos.mensaje ||
            "No se pudo obtener el dashboard."
        );
    }

    return datos.dashboard;
}


// =====================================================
// ÚLTIMOS PRESUPUESTOS
// =====================================================

export async function obtenerUltimosPresupuestos() {

    const response = await fetch(
        `${API}/admin/dashboard/ultimos-presupuestos`
    );

    const datos =
        await response.json();

    if (
        !response.ok ||
        !datos.ok
    ) {
        throw new Error(
            datos.mensaje ||
            "No se pudieron obtener los últimos presupuestos."
        );
    }

    return datos.presupuestos;
}