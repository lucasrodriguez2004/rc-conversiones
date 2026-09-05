import {
  useEffect,
  useState
} from "react";

import {
  CATALOGO_CATEGORIAS as CATEGORIAS_FALLBACK
} from "../data/catalogoCategorias";

const API =
  (import.meta.env.VITE_API_URL || "")
    .replace(/\/+$/, "");

export function useCatalogoCategorias() {
  const [categorias, setCategorias] =
    useState(CATEGORIAS_FALLBACK);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        const response =
          await fetch(
            `${API}/catalogo-categorias`
          );

        const data =
          await response.json();

        if (
          activo &&
          response.ok &&
          data?.ok &&
          Array.isArray(
            data.categorias
          ) &&
          data.categorias.length
        ) {
          setCategorias(
            data.categorias
          );
        }
      } catch (error) {
        console.warn(
          "Usando categorías locales:",
          error
        );
      }
    }

    cargar();

    return () => {
      activo = false;
    };
  }, []);

  return categorias;
}
