import AdminPanel from "../components/AdminPanel";

export default function Admin() {

    const logueado = localStorage.getItem("admin");

    if (logueado !== "true") {

        window.location.href = "/login";

        return null;

    }

    return (

        <AdminPanel />

    );

}