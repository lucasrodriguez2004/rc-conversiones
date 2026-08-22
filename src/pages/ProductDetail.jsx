import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { obtenerProducto } from "../services/api";
import "../styles/ProductDetail.css";

export default function ProductDetail(){

    const { id } = useParams();

    const [producto,setProducto]=useState(null);

    useEffect(()=>{

        cargarProducto();

    },[]);

    async function cargarProducto(){

        const datos=await obtenerProducto(id);

        setProducto(datos);

    }

    if(!producto){

        return <h2>Cargando...</h2>;

    }

    return(

        <section className="productDetail">

            <img
                src={producto.imagen}
                alt={producto.nombre}
            />

            <div>

                <h1>{producto.nombre}</h1>

                <h2>

                    ${Number(producto.precio).toLocaleString("es-AR")}

                </h2>

                <p>

                    {producto.descripcion}

                </p>

                <p>

                    Stock: {producto.stock}

                </p>

                <a
                    href={`https://wa.me/5492223575089?text=Hola,%20quiero%20consultar%20por%20${producto.nombre}`}
                    target="_blank"
                    rel="noreferrer"
                >

                    Consultar por WhatsApp

                </a>

            </div>

        </section>

    )

}