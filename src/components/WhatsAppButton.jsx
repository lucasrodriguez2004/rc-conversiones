import { FaWhatsapp } from "react-icons/fa";
import "../styles/WhatsAppButton.css";

export default function WhatsAppButton() {
  return (
    <a
      className="whatsapp"
      href="https://wa.me/5492223575089"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      title="Escribinos por WhatsApp"
    >
      <FaWhatsapp />
    </a>
  );
}