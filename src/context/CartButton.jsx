import { FaShoppingCart } from "react-icons/fa";
import { useCart } from "./src/context/CartContext";
import "../styles/CartButton.css";

export default function CartButton({ abrir }) {

    const { carrito } = useCart();

    const cantidad = carrito.reduce(
        (total, item) => total + item.cantidad,
        0
    );

    return (

        <button
            className="cartButton"
            onClick={abrir}
        >

            <FaShoppingCart />

            {
                cantidad > 0 &&
                <span>{cantidad}</span>
            }

        </button>

    );

}