import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {

    const [carrito, setCarrito] = useState([]);

    function agregarAlCarrito(producto) {

        const existe = carrito.find((p) => p.id === producto.id);

        if (existe) {

            setCarrito(

                carrito.map((p) =>
                    p.id === producto.id
                        ? { ...p, cantidad: p.cantidad + 1 }
                        : p
                )

            );

        } else {

            setCarrito([

                ...carrito,

                {

                    ...producto,

                    cantidad: 1

                }

            ]);

        }

    }

    function eliminarDelCarrito(id) {

        setCarrito(carrito.filter((p) => p.id !== id));

    }

    function vaciarCarrito() {

        setCarrito([]);

    }

    return (

        <CartContext.Provider
            value={{
                carrito,
                agregarAlCarrito,
                eliminarDelCarrito,
                vaciarCarrito
            }}
        >

            {children}

        </CartContext.Provider>

    );

}

export function useCart() {

    return useContext(CartContext);

}