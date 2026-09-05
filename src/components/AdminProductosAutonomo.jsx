import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  CATALOGO_CATEGORIAS
} from "../data/catalogoCategorias";

import "../styles/AdminProductosAutonomo.css";

const API =
  (
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000"
  ).replace(/\/+$/, "");

function obtenerTokenAdmin() {
  const claves = [
    "admin_token",
    "token_admin",
    "adminToken",
    "tokenAdmin",
    "token"
  ];

  for (const clave of claves) {
    const valor =
      localStorage.getItem(clave);

    if (valor) {
      return valor;
    }
  }

  try {
    const admin =
      JSON.parse(
        localStorage.getItem(
          "administrador"
        ) || "{}"
      );

    if (admin?.token) {
      return admin.token;
    }
  } catch {
    // sin acción
  }

  return "";
}

function resolverImagen(valor) {
  if (!valor) {
    return "/images/logo.png";
  }

  const imagen =
    String(valor).trim();

  if (
    imagen.startsWith("http://") ||
    imagen.startsWith("https://")
  ) {
    return imagen;
  }

  if (
    imagen.startsWith("/images/")
  ) {
    return imagen;
  }

  if (
    imagen.startsWith("/uploads/")
  ) {
    return API + imagen;
  }

  return imagen;
}

const FORM_VACIO = {
  id: null,
  codigo: "",
  nombre: "",
  categoria: "",
  subcategoria: "",
  descripcion: "",
  caracteristicas: "",
  imagen: "",
  destacado: false
};

export default function AdminProductosAutonomo() {
  const navigate =
    useNavigate();

  const [productos, setProductos] =
    useState([]);

  const [
    catalogo,
    setCatalogo
  ] =
    useState(
      CATALOGO_CATEGORIAS
    );

  const [busqueda, setBusqueda] =
    useState("");

  const [form, setForm] =
    useState(FORM_VACIO);

  const [
    imagenFile,
    setImagenFile
  ] =
    useState(null);

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [error, setError] =
    useState("");

  const token =
    obtenerTokenAdmin();

  async function fetchAdmin(
    url,
    options = {}
  ) {
    const headers = {
      ...(options.headers || {}),
      Authorization:
        `Bearer ${token}`
    };

    const response =
      await fetch(
        API + url,
        {
          ...options,
          headers
        }
      );

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      navigate("/admin");
      throw new Error(
        "Tu sesión de administrador no es válida."
      );
    }

    return response;
  }

  async function cargar() {
    try {
      setCargando(true);
      setError("");

      if (!token) {
        navigate("/admin");
        return;
      }

      const [
        productosResponse,
        categoriasResponse
      ] =
        await Promise.all([
          fetchAdmin(
            "/admin/productos-autonomo"
          ),
          fetch(
            API +
            "/catalogo-categorias"
          )
        ]);

      const productosData =
        await productosResponse.json();

      if (
        !productosResponse.ok ||
        !productosData?.ok
      ) {
        throw new Error(
          productosData?.mensaje ||
          "No se pudieron cargar los productos."
        );
      }

      setProductos(
        productosData.productos ||
        []
      );

      if (
        categoriasResponse.ok
      ) {
        const categoriasData =
          await categoriasResponse.json();

        if (
          categoriasData?.ok &&
          Array.isArray(
            categoriasData.categorias
          )
        ) {
          setCatalogo(
            categoriasData.categorias
          );
        }
      }
    } catch (err) {
      setError(
        err.message ||
        "No se pudo cargar el panel."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const categorias =
    useMemo(
      () =>
        [...new Set(
          catalogo.map(
            item => item.nombre
          )
        )],
      [catalogo]
    );

  const subcategorias =
    useMemo(() => {
      const categoria =
        catalogo.find(
          item =>
            item.nombre ===
            form.categoria
        );

      return (
        categoria?.subcategorias ||
        []
      );
    }, [
      catalogo,
      form.categoria
    ]);

  const filtrados =
    useMemo(() => {
      const q =
        busqueda
          .trim()
          .toLowerCase();

      if (!q) {
        return productos;
      }

      return productos.filter(
        producto =>
          [
            producto.codigo,
            producto.nombre,
            producto.categoria,
            producto.subcategoria,
            producto.descripcion,
            producto.caracteristicas
          ]
            .some(
              valor =>
                String(valor || "")
                  .toLowerCase()
                  .includes(q)
            )
      );
    }, [
      productos,
      busqueda
    ]);

  function cambiarCampo(
    event
  ) {
    const {
      name,
      value,
      type,
      checked
    } = event.target;

    setForm(prev => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value
    }));
  }

  function nuevo() {
    setForm(FORM_VACIO);
    setImagenFile(null);
    setMensaje("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function editar(producto) {
    setForm({
      id:
        producto.id,
      codigo:
        producto.codigo || "",
      nombre:
        producto.nombre || "",
      categoria:
        producto.categoria || "",
      subcategoria:
        producto.subcategoria || "",
      descripcion:
        producto.descripcion || "",
      caracteristicas:
        producto.caracteristicas || "",
      imagen:
        producto.imagen || "",
      destacado:
        Boolean(
          Number(
            producto.destacado
          )
        )
    });

    setImagenFile(null);
    setMensaje("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  async function subirImagen() {
    if (!imagenFile) {
      return form.imagen;
    }

    const body =
      new FormData();

    body.append(
      "imagen",
      imagenFile
    );

    const response =
      await fetchAdmin(
        "/admin/productos-autonomo/upload",
        {
          method: "POST",
          body
        }
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data?.ok
    ) {
      throw new Error(
        data?.mensaje ||
        "No se pudo subir la imagen."
      );
    }

    return data.ruta;
  }

  async function guardar(
    event
  ) {
    event.preventDefault();

    if (guardando) {
      return;
    }

    if (!form.nombre.trim()) {
      setError(
        "Ingresá el nombre del producto."
      );
      return;
    }

    if (!form.categoria.trim()) {
      setError(
        "Ingresá una categoría."
      );
      return;
    }

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const imagen =
        await subirImagen();

      const payload = {
        codigo:
          form.codigo.trim(),
        nombre:
          form.nombre.trim(),
        categoria:
          form.categoria.trim(),
        subcategoria:
          form.subcategoria.trim(),
        descripcion:
          form.descripcion.trim(),
        caracteristicas:
          form.caracteristicas.trim(),
        imagen,
        destacado:
          form.destacado
            ? 1
            : 0
      };

      const esEdicion =
        Boolean(form.id);

      const response =
        await fetchAdmin(
          esEdicion
            ? `/admin/productos-autonomo/${form.id}`
            : "/admin/productos-autonomo",
          {
            method:
              esEdicion
                ? "PUT"
                : "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body:
              JSON.stringify(
                payload
              )
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.ok
      ) {
        throw new Error(
          data?.mensaje ||
          "No se pudo guardar el producto."
        );
      }

      setMensaje(
        esEdicion
          ? "Producto actualizado correctamente."
          : "Producto agregado correctamente."
      );

      setForm(FORM_VACIO);
      setImagenFile(null);

      await cargar();
    } catch (err) {
      setError(
        err.message ||
        "No se pudo guardar el producto."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(
    producto
  ) {
    const confirmar =
      window.confirm(
        `¿Eliminar definitivamente "${producto.nombre}"?`
      );

    if (!confirmar) {
      return;
    }

    try {
      setError("");
      setMensaje("");

      const response =
        await fetchAdmin(
          `/admin/productos-autonomo/${producto.id}`,
          {
            method: "DELETE"
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.ok
      ) {
        throw new Error(
          data?.mensaje ||
          "No se pudo eliminar el producto."
        );
      }

      setMensaje(
        "Producto eliminado correctamente."
      );

      await cargar();
    } catch (err) {
      setError(
        err.message ||
        "No se pudo eliminar el producto."
      );
    }
  }

  return (
    <main className="adminProductsPage">
      <header className="adminProductsHero">
        <div>
          <span className="adminEyebrow">
            RC CONVERSIONES
          </span>

          <h1>
            Administración de productos
          </h1>

          <p>
            Agregá, editá y eliminá productos sin tocar
            MySQL, GitHub ni Vercel.
          </p>
        </div>

        <div className="adminHeroActions">
          <button
            type="button"
            className="adminSecondaryBtn"
            onClick={() =>
              navigate("/admin")
            }
          >
            ← Panel principal
          </button>

          <button
            type="button"
            className="adminPrimaryBtn"
            onClick={nuevo}
          >
            + Nuevo producto
          </button>
        </div>
      </header>

      <section className="adminProductEditor">
        <div className="adminSectionTitle">
          <div>
            <h2>
              {form.id
                ? "Editar producto"
                : "Nuevo producto"}
            </h2>

            <p>
              El precio público queda automáticamente en
              <strong> Consultar</strong>.
            </p>
          </div>

          {form.id && (
            <button
              type="button"
              className="adminTextBtn"
              onClick={nuevo}
            >
              Cancelar edición
            </button>
          )}
        </div>

        <form
          className="adminProductForm"
          onSubmit={guardar}
        >
          <label>
            <span>Código</span>
            <input
              name="codigo"
              value={form.codigo}
              onChange={cambiarCampo}
              placeholder="Ej: REN.RNG-CTRL-RVR40"
            />
            <small>
              Podés dejarlo vacío y se genera uno automáticamente.
            </small>
          </label>

          <label className="adminWideField">
            <span>Nombre *</span>
            <input
              name="nombre"
              value={form.nombre}
              onChange={cambiarCampo}
              placeholder="Nombre del producto"
              required
            />
          </label>

          <label>
            <span>Categoría *</span>
            <input
              name="categoria"
              list="adminCategoriasList"
              value={form.categoria}
              onChange={cambiarCampo}
              placeholder="Ej: Heladeras"
              required
            />
            <datalist id="adminCategoriasList">
              {categorias.map(
                categoria => (
                  <option
                    key={categoria}
                    value={categoria}
                  />
                )
              )}
            </datalist>
            <small>
              Si escribís una nueva, se incorporará al catálogo público.
            </small>
          </label>

          <label>
            <span>Subcategoría</span>
            <input
              name="subcategoria"
              list="adminSubcategoriasList"
              value={form.subcategoria}
              onChange={cambiarCampo}
              placeholder="Ej: Heladeras 12/24V"
            />
            <datalist id="adminSubcategoriasList">
              {subcategorias.map(
                sub => (
                  <option
                    key={sub}
                    value={sub}
                  />
                )
              )}
            </datalist>
          </label>

          <label className="adminWideField">
            <span>Descripción breve</span>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={cambiarCampo}
              rows="4"
              placeholder="Descripción que verá el cliente..."
            />
          </label>

          <label className="adminWideField">
            <span>Características</span>
            <textarea
              name="caracteristicas"
              value={form.caracteristicas}
              onChange={cambiarCampo}
              rows="5"
              placeholder={"• Alimentación: 12/24V\n• Capacidad: 220 litros"}
            />
          </label>

          <label className="adminWideField">
            <span>Imagen</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={event =>
                setImagenFile(
                  event.target.files?.[0] ||
                  null
                )
              }
            />
            <small>
              JPG, PNG o WebP. Máximo 8 MB. Se guarda en Cloudinary.
            </small>
          </label>

          {(imagenFile || form.imagen) && (
            <div className="adminImagePreview adminWideField">
              <img
                src={
                  imagenFile
                    ? URL.createObjectURL(
                        imagenFile
                      )
                    : resolverImagen(
                        form.imagen
                      )
                }
                alt="Vista previa"
              />
            </div>
          )}

          <label className="adminCheckField">
            <input
              type="checkbox"
              name="destacado"
              checked={form.destacado}
              onChange={cambiarCampo}
            />
            <span>
              Mostrar como destacado
            </span>
          </label>

          <div className="adminFormActions adminWideField">
            <button
              type="submit"
              className="adminPrimaryBtn"
              disabled={guardando}
            >
              {guardando
                ? "Guardando..."
                : form.id
                ? "Guardar cambios"
                : "Agregar producto"}
            </button>
          </div>
        </form>

        {mensaje && (
          <div className="adminMessage success">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="adminMessage error">
            {error}
          </div>
        )}
      </section>

      <section className="adminProductsList">
        <div className="adminSectionTitle">
          <div>
            <h2>Productos</h2>
            <p>
              {productos.length} productos registrados
            </p>
          </div>

          <input
            className="adminSearch"
            value={busqueda}
            onChange={event =>
              setBusqueda(
                event.target.value
              )
            }
            placeholder="Buscar producto..."
          />
        </div>

        {cargando ? (
          <div className="adminEmpty">
            Cargando productos...
          </div>
        ) : (
          <div className="adminProductGrid">
            {filtrados.map(
              producto => (
                <article
                  className="adminProductCard"
                  key={producto.id}
                >
                  <div className="adminProductImage">
                    <img
                      src={resolverImagen(
                        producto.imagen
                      )}
                      alt={producto.nombre}
                      loading="lazy"
                    />
                  </div>

                  <div className="adminProductBody">
                    <span className="adminProductCategory">
                      {producto.categoria}
                      {producto.subcategoria
                        ? " · " +
                          producto.subcategoria
                        : ""}
                    </span>

                    <h3>
                      {producto.nombre}
                    </h3>

                    <p className="adminProductCode">
                      {producto.codigo ||
                        "Sin código"}
                    </p>

                    <p className="adminProductDescription">
                      {producto.descripcion ||
                        "Sin descripción."}
                    </p>

                    <strong className="adminConsultar">
                      Consultar
                    </strong>

                    <div className="adminCardActions">
                      <button
                        type="button"
                        className="adminEditBtn"
                        onClick={() =>
                          editar(producto)
                        }
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="adminDeleteBtn"
                        onClick={() =>
                          eliminar(producto)
                        }
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
        )}

        {!cargando &&
          filtrados.length === 0 && (
            <div className="adminEmpty">
              No encontramos productos con esa búsqueda.
            </div>
          )}
      </section>
    </main>
  );
}
