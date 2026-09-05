import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  FaArrowLeft,
  FaBoxOpen,
  FaEye,
  FaEyeSlash,
  FaImage,
  FaPen,
  FaPlus,
  FaSave,
  FaSearch,
  FaSignOutAlt,
  FaTags,
  FaTrash
} from "react-icons/fa";

import "../styles/AdminCatalogo.css";

const API =
  (import.meta.env.VITE_API_URL || "")
    .replace(/\/+$/, "");

const TOKEN_KEY =
  "admin_token";

const ADMIN_KEY =
  "administrador";

function resolverImagen(imagen) {
  if (!imagen) {
    return "/images/logo.png";
  }

  const valor =
    String(imagen).trim();

  if (
    valor.startsWith("http://") ||
    valor.startsWith("https://")
  ) {
    return valor;
  }

  if (
    valor.startsWith("/images/")
  ) {
    return valor;
  }

  if (
    valor.startsWith("/uploads/")
  ) {
    return API
      ? `${API}${valor}`
      : valor;
  }

  return valor;
}

function slugify(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
  destacado: false,
  activo: true
};

export default function AdminCatalogo() {
  const [token, setToken] =
    useState(
      () =>
        localStorage.getItem(
          TOKEN_KEY
        ) || ""
    );

  const [admin, setAdmin] =
    useState(() => {
      try {
        return JSON.parse(
          localStorage.getItem(
            ADMIN_KEY
          ) || "null"
        );
      } catch {
        return null;
      }
    });

  const [login, setLogin] =
    useState({
      usuario: "",
      password: ""
    });

  const [loginError, setLoginError] =
    useState("");

  const [loginCargando, setLoginCargando] =
    useState(false);

  const [tab, setTab] =
    useState("productos");

  const [productos, setProductos] =
    useState([]);

  const [categorias, setCategorias] =
    useState([]);

  const [resumen, setResumen] =
    useState({
      total: 0,
      visibles: 0,
      ocultos: 0
    });

  const [busqueda, setBusqueda] =
    useState("");

  const [filtroCategoria, setFiltroCategoria] =
    useState("");

  const [soloOcultos, setSoloOcultos] =
    useState(false);

  const [form, setForm] =
    useState(FORM_VACIO);

  const [mostrarForm, setMostrarForm] =
    useState(false);

  const [imagenFile, setImagenFile] =
    useState(null);

  const [preview, setPreview] =
    useState("");

  const [guardando, setGuardando] =
    useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const [cargando, setCargando] =
    useState(false);

  const [categoriaForm, setCategoriaForm] =
    useState({
      id: null,
      nombre: "",
      slug: "",
      subcategorias: "",
      activo: true
    });

  const [mostrarCategoriaForm, setMostrarCategoriaForm] =
    useState(false);

  function cerrarSesion() {
    localStorage.removeItem(
      TOKEN_KEY
    );

    localStorage.removeItem(
      ADMIN_KEY
    );

    setToken("");
    setAdmin(null);
  }

  async function request(
    ruta,
    opciones = {}
  ) {
    const headers = {
      ...(opciones.headers || {})
    };

    if (token) {
      headers.Authorization =
        `Bearer ${token}`;
    }

    const response =
      await fetch(
        `${API}${ruta}`,
        {
          ...opciones,
          headers
        }
      );

    let data = null;

    try {
      data =
        await response.json();
    } catch {
      data = {
        ok: false,
        mensaje:
          "Respuesta inválida del servidor."
      };
    }

    if (
      response.status === 401 &&
      token
    ) {
      cerrarSesion();

      throw new Error(
        "Tu sesión venció. Iniciá sesión nuevamente."
      );
    }

    if (!response.ok) {
      throw new Error(
        data?.mensaje ||
        "La operación no se pudo completar."
      );
    }

    return data;
  }

  async function iniciarSesion(event) {
    event.preventDefault();

    try {
      setLoginCargando(true);
      setLoginError("");

      const response =
        await fetch(
          `${API}/admin/login`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify(
              login
            )
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.ok ||
        !data?.token
      ) {
        throw new Error(
          data?.mensaje ||
          "No se pudo iniciar sesión."
        );
      }

      localStorage.setItem(
        TOKEN_KEY,
        data.token
      );

      localStorage.setItem(
        ADMIN_KEY,
        JSON.stringify(
          data.administrador
        )
      );

      setToken(data.token);
      setAdmin(
        data.administrador
      );

      setLogin({
        usuario: "",
        password: ""
      });
    } catch (error) {
      setLoginError(
        error.message
      );
    } finally {
      setLoginCargando(false);
    }
  }

  async function cargarTodo() {
    if (!token) {
      return;
    }

    try {
      setCargando(true);
      setMensaje("");

      const [
        productosData,
        categoriasData
      ] = await Promise.all([
        request(
          "/admin/productos"
        ),
        request(
          "/admin/catalogo-categorias"
        )
      ]);

      setProductos(
        productosData.productos ||
        []
      );

      setResumen(
        productosData.resumen || {
          total: 0,
          visibles: 0,
          ocultos: 0
        }
      );

      setCategorias(
        categoriasData.categorias ||
        []
      );
    } catch (error) {
      setMensaje(
        error.message
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarTodo();
  }, [token]);

  useEffect(() => {
    return () => {
      if (
        preview &&
        preview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          preview
        );
      }
    };
  }, [preview]);

  const subcategoriasActuales =
    useMemo(() => {
      const cat =
        categorias.find(
          item =>
            item.nombre ===
            form.categoria
        );

      return Array.isArray(
        cat?.subcategorias
      )
        ? cat.subcategorias
        : [];
    }, [
      categorias,
      form.categoria
    ]);

  const productosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return productos.filter(
        producto => {
          if (
            filtroCategoria &&
            producto.categoria !==
              filtroCategoria
          ) {
            return false;
          }

          if (
            soloOcultos &&
            Number(
              producto.activo ?? 1
            ) === 1
          ) {
            return false;
          }

          if (!texto) {
            return true;
          }

          return [
            producto.codigo,
            producto.nombre,
            producto.categoria,
            producto.subcategoria,
            producto.descripcion,
            producto.caracteristicas
          ].some(
            valor =>
              String(valor || "")
                .toLowerCase()
                .includes(texto)
          );
        }
      );
    }, [
      productos,
      busqueda,
      filtroCategoria,
      soloOcultos
    ]);

  function nuevoProducto() {
    setForm(
      FORM_VACIO
    );

    setImagenFile(null);
    setPreview("");
    setMostrarForm(true);
    setMensaje("");
  }

  function editarProducto(producto) {
    setForm({
      id: producto.id,
      codigo:
        producto.codigo || "",
      nombre:
        producto.nombre || "",
      categoria:
        producto.categoria || "",
      subcategoria:
        producto.subcategoria ||
        "",
      descripcion:
        producto.descripcion ||
        "",
      caracteristicas:
        producto.caracteristicas ||
        "",
      imagen:
        producto.imagen || "",
      destacado:
        Boolean(
          Number(
            producto.destacado ||
            0
          )
        ),
      activo:
        Number(
          producto.activo ?? 1
        ) === 1
    });

    setImagenFile(null);

    setPreview(
      resolverImagen(
        producto.imagen
      )
    );

    setMostrarForm(true);
    setMensaje("");
  }

  function seleccionarImagen(event) {
    const file =
      event.target.files?.[0] ||
      null;

    setImagenFile(file);

    if (
      preview &&
      preview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        preview
      );
    }

    setPreview(
      file
        ? URL.createObjectURL(
            file
          )
        : resolverImagen(
            form.imagen
          )
    );
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

    const data =
      await request(
        "/upload",
        {
          method: "POST",
          body
        }
      );

    if (!data?.ruta) {
      throw new Error(
        "El servidor no devolvió la imagen subida."
      );
    }

    return data.ruta;
  }

  async function guardarProducto(event) {
    event.preventDefault();

    if (
      !form.nombre.trim() ||
      !form.categoria.trim()
    ) {
      setMensaje(
        "Nombre y categoría son obligatorios."
      );

      return;
    }

    try {
      setGuardando(true);
      setMensaje("");

      const imagen =
        await subirImagen();

      const payload = {
        ...form,
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
            : 0,
        activo:
          form.activo
            ? 1
            : 0
      };

      if (form.id) {
        await request(
          `/admin/productos/${form.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify(
              payload
            )
          }
        );
      } else {
        await request(
          "/admin/productos",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify(
              payload
            )
          }
        );
      }

      setMostrarForm(false);
      setImagenFile(null);
      setPreview("");
      setForm(FORM_VACIO);
      setMensaje(
        "Producto guardado correctamente."
      );

      await cargarTodo();
    } catch (error) {
      setMensaje(
        error.message
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarVisibilidad(
    producto
  ) {
    try {
      const activo =
        Number(
          producto.activo ?? 1
        ) === 1
          ? 0
          : 1;

      await request(
        `/admin/productos/${producto.id}/activo`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            activo
          })
        }
      );

      await cargarTodo();
    } catch (error) {
      setMensaje(
        error.message
      );
    }
  }

  async function borrarProducto(
    producto
  ) {
    const confirmar =
      window.confirm(
        `¿Eliminar definitivamente "${producto.nombre}"?\n\nSi solo querés que no aparezca en la web, usá Ocultar.`
      );

    if (!confirmar) {
      return;
    }

    try {
      await request(
        `/admin/productos/${producto.id}`,
        {
          method: "DELETE"
        }
      );

      setMensaje(
        "Producto eliminado."
      );

      await cargarTodo();
    } catch (error) {
      setMensaje(
        error.message
      );
    }
  }

  function nuevaCategoria() {
    setCategoriaForm({
      id: null,
      nombre: "",
      slug: "",
      subcategorias: "",
      activo: true
    });

    setMostrarCategoriaForm(true);
    setMensaje("");
  }

  function editarCategoria(cat) {
    setCategoriaForm({
      id: cat.id,
      nombre: cat.nombre || "",
      slug: cat.slug || "",
      subcategorias:
        (
          cat.subcategorias ||
          []
        ).join("\n"),
      activo:
        Number(
          cat.activo ?? 1
        ) === 1
    });

    setMostrarCategoriaForm(true);
    setMensaje("");
  }

  async function guardarCategoria(
    event
  ) {
    event.preventDefault();

    const nombre =
      categoriaForm.nombre.trim();

    if (!nombre) {
      setMensaje(
        "El nombre de la categoría es obligatorio."
      );
      return;
    }

    const payload = {
      nombre,
      slug:
        categoriaForm.slug.trim() ||
        slugify(nombre),
      subcategorias:
        categoriaForm.subcategorias
          .split("\n")
          .map(x => x.trim())
          .filter(Boolean),
      activo:
        categoriaForm.activo
          ? 1
          : 0
    };

    try {
      setGuardando(true);
      setMensaje("");

      if (
        categoriaForm.id
      ) {
        await request(
          `/admin/catalogo-categorias/${categoriaForm.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify(
              payload
            )
          }
        );
      } else {
        await request(
          "/admin/catalogo-categorias",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify(
              payload
            )
          }
        );
      }

      setMostrarCategoriaForm(
        false
      );

      setMensaje(
        "Categoría guardada."
      );

      await cargarTodo();
    } catch (error) {
      setMensaje(
        error.message
      );
    } finally {
      setGuardando(false);
    }
  }

  async function borrarCategoria(cat) {
    if (
      !window.confirm(
        `¿Eliminar la categoría "${cat.nombre}"?`
      )
    ) {
      return;
    }

    try {
      await request(
        `/admin/catalogo-categorias/${cat.id}`,
        {
          method: "DELETE"
        }
      );

      setMensaje(
        "Categoría eliminada."
      );

      await cargarTodo();
    } catch (error) {
      setMensaje(
        error.message
      );
    }
  }

  if (!token) {
    return (
      <main className="adminCatalogoLoginPage">
        <section className="adminCatalogoLoginCard">
          <div className="adminCatalogoBrand">
            <span>RC</span>
            <div>
              <strong>
                CONVERSIONES
              </strong>
              <small>
                ADMINISTRACIÓN
              </small>
            </div>
          </div>

          <h1>
            Panel de catálogo
          </h1>

          <p>
            Acceso exclusivo para administración.
          </p>

          <form
            onSubmit={
              iniciarSesion
            }
          >
            <label>
              Usuario
              <input
                value={
                  login.usuario
                }
                onChange={e =>
                  setLogin(
                    actual => ({
                      ...actual,
                      usuario:
                        e.target.value
                    })
                  )
                }
                autoComplete="username"
              />
            </label>

            <label>
              Contraseña
              <input
                type="password"
                value={
                  login.password
                }
                onChange={e =>
                  setLogin(
                    actual => ({
                      ...actual,
                      password:
                        e.target.value
                    })
                  )
                }
                autoComplete="current-password"
              />
            </label>

            {loginError && (
              <div className="adminCatalogoError">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={
                loginCargando
              }
            >
              {loginCargando
                ? "Ingresando..."
                : "Ingresar"}
            </button>
          </form>

          <a
            href="/"
            className="adminCatalogoBack"
          >
            <FaArrowLeft />
            Volver a la web
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="adminCatalogoPage">
      <header className="adminCatalogoTopbar">
        <div className="adminCatalogoBrand">
          <span>RC</span>
          <div>
            <strong>
              CONVERSIONES
            </strong>
            <small>
              CATÁLOGO
            </small>
          </div>
        </div>

        <div className="adminCatalogoTopActions">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
          >
            Ver sitio
          </a>

          <span>
            {admin?.usuario ||
              "Admin"}
          </span>

          <button
            type="button"
            onClick={
              cerrarSesion
            }
          >
            <FaSignOutAlt />
            Salir
          </button>
        </div>
      </header>

      <section className="adminCatalogoShell">
        <div className="adminCatalogoHeading">
          <div>
            <span className="adminCatalogoEyebrow">
              RC CONVERSIONES
            </span>

            <h1>
              Administración del catálogo
            </h1>

            <p>
              Agregá, editá y organizá productos sin tocar código.
            </p>
          </div>

          {tab ===
            "productos" && (
            <button
              type="button"
              className="adminCatalogoPrimary"
              onClick={
                nuevoProducto
              }
            >
              <FaPlus />
              Nuevo producto
            </button>
          )}

          {tab ===
            "categorias" && (
            <button
              type="button"
              className="adminCatalogoPrimary"
              onClick={
                nuevaCategoria
              }
            >
              <FaPlus />
              Nueva categoría
            </button>
          )}
        </div>

        <nav className="adminCatalogoTabs">
          <button
            type="button"
            className={
              tab ===
              "productos"
                ? "activo"
                : ""
            }
            onClick={() =>
              setTab(
                "productos"
              )
            }
          >
            <FaBoxOpen />
            Productos
          </button>

          <button
            type="button"
            className={
              tab ===
              "categorias"
                ? "activo"
                : ""
            }
            onClick={() =>
              setTab(
                "categorias"
              )
            }
          >
            <FaTags />
            Categorías
          </button>
        </nav>

        {mensaje && (
          <div className="adminCatalogoMessage">
            {mensaje}
          </div>
        )}

        {tab ===
          "productos" && (
          <>
            <section className="adminCatalogoStats">
              <article>
                <span>
                  Total
                </span>
                <strong>
                  {resumen.total}
                </strong>
              </article>

              <article>
                <span>
                  Visibles
                </span>
                <strong>
                  {resumen.visibles}
                </strong>
              </article>

              <article>
                <span>
                  Ocultos
                </span>
                <strong>
                  {resumen.ocultos}
                </strong>
              </article>
            </section>

            <section className="adminCatalogoFilters">
              <div className="adminCatalogoSearch">
                <FaSearch />
                <input
                  placeholder="Buscar por nombre, código o categoría..."
                  value={
                    busqueda
                  }
                  onChange={e =>
                    setBusqueda(
                      e.target.value
                    )
                  }
                />
              </div>

              <select
                value={
                  filtroCategoria
                }
                onChange={e =>
                  setFiltroCategoria(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Todas las categorías
                </option>

                {categorias.map(
                  cat => (
                    <option
                      key={
                        cat.id ||
                        cat.slug
                      }
                      value={
                        cat.nombre
                      }
                    >
                      {cat.nombre}
                    </option>
                  )
                )}
              </select>

              <label className="adminCatalogoCheck">
                <input
                  type="checkbox"
                  checked={
                    soloOcultos
                  }
                  onChange={e =>
                    setSoloOcultos(
                      e.target.checked
                    )
                  }
                />
                Solo ocultos
              </label>
            </section>

            {cargando ? (
              <div className="adminCatalogoEmpty">
                Cargando productos...
              </div>
            ) : (
              <section className="adminCatalogoProducts">
                {productosFiltrados.map(
                  producto => (
                    <article
                      className={
                        `adminCatalogoProduct ${Number(
                          producto.activo ??
                            1
                        ) === 1
                          ? ""
                          : "oculto"}`
                      }
                      key={
                        producto.id
                      }
                    >
                      <div className="adminCatalogoProductImage">
                        <img
                          src={resolverImagen(
                            producto.imagen
                          )}
                          alt={
                            producto.nombre
                          }
                        />
                      </div>

                      <div className="adminCatalogoProductInfo">
                        <div className="adminCatalogoBadges">
                          <span>
                            {producto.categoria ||
                              "Sin categoría"}
                          </span>

                          {producto.subcategoria && (
                            <span>
                              {producto.subcategoria}
                            </span>
                          )}

                          {Number(
                            producto.activo ??
                              1
                          ) !== 1 && (
                            <span className="adminCatalogoHiddenBadge">
                              Oculto
                            </span>
                          )}
                        </div>

                        <h2>
                          {producto.nombre}
                        </h2>

                        <code>
                          {producto.codigo ||
                            "Sin código"}
                        </code>

                        <p>
                          {producto.descripcion ||
                            "Sin descripción."}
                        </p>

                        <strong className="adminCatalogoConsultar">
                          Consultar
                        </strong>
                      </div>

                      <div className="adminCatalogoProductActions">
                        <button
                          type="button"
                          onClick={() =>
                            editarProducto(
                              producto
                            )
                          }
                        >
                          <FaPen />
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            cambiarVisibilidad(
                              producto
                            )
                          }
                        >
                          {Number(
                            producto.activo ??
                              1
                          ) === 1 ? (
                            <>
                              <FaEyeSlash />
                              Ocultar
                            </>
                          ) : (
                            <>
                              <FaEye />
                              Mostrar
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          className="danger"
                          onClick={() =>
                            borrarProducto(
                              producto
                            )
                          }
                        >
                          <FaTrash />
                          Eliminar
                        </button>
                      </div>
                    </article>
                  )
                )}

                {!productosFiltrados.length && (
                  <div className="adminCatalogoEmpty">
                    No hay productos que coincidan con los filtros.
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {tab ===
          "categorias" && (
          <section className="adminCatalogoCategories">
            {categorias.map(
              cat => (
                <article
                  key={
                    cat.id ||
                    cat.slug
                  }
                >
                  <div>
                    <span>
                      /categoria/{cat.slug}
                    </span>

                    <h2>
                      {cat.nombre}
                    </h2>

                    <p>
                      {(
                        cat.subcategorias ||
                        []
                      ).length} subcategorías
                    </p>
                  </div>

                  <div className="adminCatalogoCategorySubs">
                    {(
                      cat.subcategorias ||
                      []
                    ).map(sub => (
                      <span
                        key={sub}
                      >
                        {sub}
                      </span>
                    ))}
                  </div>

                  <div className="adminCatalogoCategoryActions">
                    <button
                      type="button"
                      onClick={() =>
                        editarCategoria(
                          cat
                        )
                      }
                    >
                      <FaPen />
                      Editar
                    </button>

                    <button
                      type="button"
                      className="danger"
                      onClick={() =>
                        borrarCategoria(
                          cat
                        )
                      }
                    >
                      <FaTrash />
                      Eliminar
                    </button>
                  </div>
                </article>
              )
            )}
          </section>
        )}
      </section>

      {mostrarForm && (
        <div className="adminCatalogoModalBackdrop">
          <section className="adminCatalogoModal">
            <div className="adminCatalogoModalTop">
              <div>
                <span>
                  {form.id
                    ? "EDITAR PRODUCTO"
                    : "NUEVO PRODUCTO"}
                </span>
                <h2>
                  {form.id
                    ? form.nombre
                    : "Agregar al catálogo"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMostrarForm(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                guardarProducto
              }
            >
              <div className="adminCatalogoFormGrid">
                <label>
                  Código
                  <input
                    value={
                      form.codigo
                    }
                    placeholder="Ej: TFK.220.DISP"
                    onChange={e =>
                      setForm(
                        actual => ({
                          ...actual,
                          codigo:
                            e.target.value
                        })
                      )
                    }
                  />
                  <small>
                    Si lo dejás vacío al crear, el sistema genera uno.
                  </small>
                </label>

                <label>
                  Nombre *
                  <input
                    value={
                      form.nombre
                    }
                    onChange={e =>
                      setForm(
                        actual => ({
                          ...actual,
                          nombre:
                            e.target.value
                        })
                      )
                    }
                    required
                  />
                </label>

                <label>
                  Categoría *
                  <input
                    list="rc-admin-categorias"
                    value={
                      form.categoria
                    }
                    onChange={e =>
                      setForm(
                        actual => ({
                          ...actual,
                          categoria:
                            e.target.value,
                          subcategoria:
                            ""
                        })
                      )
                    }
                    required
                  />

                  <datalist id="rc-admin-categorias">
                    {categorias.map(
                      cat => (
                        <option
                          key={
                            cat.id ||
                            cat.slug
                          }
                          value={
                            cat.nombre
                          }
                        />
                      )
                    )}
                  </datalist>
                </label>

                <label>
                  Subcategoría
                  <input
                    list="rc-admin-subcategorias"
                    value={
                      form.subcategoria
                    }
                    onChange={e =>
                      setForm(
                        actual => ({
                          ...actual,
                          subcategoria:
                            e.target.value
                        })
                      )
                    }
                  />

                  <datalist id="rc-admin-subcategorias">
                    {subcategoriasActuales.map(
                      sub => (
                        <option
                          key={sub}
                          value={sub}
                        />
                      )
                    )}
                  </datalist>
                </label>

                <label className="adminCatalogoFull">
                  Descripción breve
                  <textarea
                    rows="4"
                    value={
                      form.descripcion
                    }
                    onChange={e =>
                      setForm(
                        actual => ({
                          ...actual,
                          descripcion:
                            e.target.value
                        })
                      )
                    }
                    placeholder="Descripción que verá el cliente..."
                  />
                </label>

                <label className="adminCatalogoFull">
                  Características
                  <textarea
                    rows="5"
                    value={
                      form.caracteristicas
                    }
                    onChange={e =>
                      setForm(
                        actual => ({
                          ...actual,
                          caracteristicas:
                            e.target.value
                        })
                      )
                    }
                    placeholder={"• Alimentación: 12/24V\n• Capacidad: 220L"}
                  />
                </label>

                <div className="adminCatalogoFull adminCatalogoImageField">
                  <div>
                    <strong>
                      Imagen del producto
                    </strong>
                    <p>
                      JPG, PNG o WebP. En producción se guardará de forma permanente.
                    </p>

                    <label className="adminCatalogoUploadButton">
                      <FaImage />
                      Elegir imagen
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={
                          seleccionarImagen
                        }
                      />
                    </label>
                  </div>

                  <div className="adminCatalogoPreview">
                    <img
                      src={
                        preview ||
                        resolverImagen(
                          form.imagen
                        )
                      }
                      alt="Vista previa"
                    />
                  </div>
                </div>

                <label className="adminCatalogoSwitch">
                  <input
                    type="checkbox"
                    checked={
                      form.activo
                    }
                    onChange={e =>
                      setForm(
                        actual => ({
                          ...actual,
                          activo:
                            e.target.checked
                        })
                      )
                    }
                  />
                  Visible en la web
                </label>

                <label className="adminCatalogoSwitch">
                  <input
                    type="checkbox"
                    checked={
                      form.destacado
                    }
                    onChange={e =>
                      setForm(
                        actual => ({
                          ...actual,
                          destacado:
                            e.target.checked
                        })
                      )
                    }
                  />
                  Producto destacado
                </label>
              </div>

              <div className="adminCatalogoModalActions">
                <button
                  type="button"
                  onClick={() =>
                    setMostrarForm(
                      false
                    )
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="adminCatalogoPrimary"
                  disabled={
                    guardando
                  }
                >
                  <FaSave />
                  {guardando
                    ? "Guardando..."
                    : "Guardar producto"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {mostrarCategoriaForm && (
        <div className="adminCatalogoModalBackdrop">
          <section className="adminCatalogoModal adminCatalogoCategoryModal">
            <div className="adminCatalogoModalTop">
              <div>
                <span>
                  CATEGORÍA
                </span>
                <h2>
                  {categoriaForm.id
                    ? "Editar categoría"
                    : "Nueva categoría"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMostrarCategoriaForm(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                guardarCategoria
              }
            >
              <label>
                Nombre
                <input
                  value={
                    categoriaForm.nombre
                  }
                  onChange={e => {
                    const nombre =
                      e.target.value;

                    setCategoriaForm(
                      actual => ({
                        ...actual,
                        nombre,
                        slug:
                          actual.id
                            ? actual.slug
                            : slugify(
                                nombre
                              )
                      })
                    );
                  }}
                  required
                />
              </label>

              <label>
                Slug / URL
                <input
                  value={
                    categoriaForm.slug
                  }
                  onChange={e =>
                    setCategoriaForm(
                      actual => ({
                        ...actual,
                        slug:
                          slugify(
                            e.target.value
                          )
                      })
                    )
                  }
                />
              </label>

              <label>
                Subcategorías
                <textarea
                  rows="12"
                  value={
                    categoriaForm.subcategorias
                  }
                  onChange={e =>
                    setCategoriaForm(
                      actual => ({
                        ...actual,
                        subcategorias:
                          e.target.value
                      })
                    )
                  }
                  placeholder={"Una por línea\nEjemplo 1\nEjemplo 2"}
                />
                <small>
                  Escribí una subcategoría por línea.
                </small>
              </label>

              <label className="adminCatalogoSwitch">
                <input
                  type="checkbox"
                  checked={
                    categoriaForm.activo
                  }
                  onChange={e =>
                    setCategoriaForm(
                      actual => ({
                        ...actual,
                        activo:
                          e.target.checked
                      })
                    )
                  }
                />
                Mostrar en el menú público
              </label>

              <div className="adminCatalogoModalActions">
                <button
                  type="button"
                  onClick={() =>
                    setMostrarCategoriaForm(
                      false
                    )
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="adminCatalogoPrimary"
                  disabled={
                    guardando
                  }
                >
                  <FaSave />
                  Guardar categoría
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
