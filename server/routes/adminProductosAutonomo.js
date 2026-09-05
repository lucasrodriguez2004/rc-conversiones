const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const crypto = require("crypto");

const db = require("../config/db");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const permitido =
      /^image\/(jpeg|png|webp)$/i.test(
        file.mimetype || ""
      );

    if (!permitido) {
      return cb(
        new Error(
          "Solo se permiten imágenes JPG, PNG o WebP."
        )
      );
    }

    cb(null, true);
  }
});

function autenticarAdmin(req, res, next) {
  const authorization =
    String(
      req.headers.authorization || ""
    );

  if (
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return res.status(401).json({
      ok: false,
      mensaje:
        "Tenés que iniciar sesión como administrador."
    });
  }

  const token =
    authorization
      .slice(7)
      .trim();

  try {
    const datos =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    if (
      !datos ||
      datos.tipo !== "admin"
    ) {
      return res.status(403).json({
        ok: false,
        mensaje:
          "No tenés permisos de administrador."
      });
    }

    req.admin = datos;
    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      mensaje:
        error?.name === "TokenExpiredError"
          ? "Tu sesión de administrador venció."
          : "La sesión de administrador no es válida."
    });
  }
}

function slugificar(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function limpiarTexto(valor, max = 10000) {
  return String(valor || "")
    .trim()
    .slice(0, max);
}

function construirCatalogo(rows) {
  const mapa = new Map();
  const renogySubs = new Set();

  for (const row of rows) {
    const categoria =
      limpiarTexto(
        row.categoria,
        120
      );

    const subcategoria =
      limpiarTexto(
        row.subcategoria,
        160
      );

    if (categoria) {
      const key =
        categoria.toLocaleLowerCase(
          "es"
        );

      if (!mapa.has(key)) {
        mapa.set(key, {
          nombre: categoria,
          slug: slugificar(categoria),
          subcategorias: new Set()
        });
      }

      if (subcategoria) {
        mapa
          .get(key)
          .subcategorias
          .add(subcategoria);
      }
    }

    const codigo =
      String(
        row.codigo || ""
      ).toUpperCase();

    const nombre =
      String(
        row.nombre || ""
      ).toLowerCase();

    const caracteristicas =
      String(
        row.caracteristicas || ""
      ).toLowerCase();

    const esRenogy =
      codigo.startsWith("REN.") ||
      nombre.includes("renogy") ||
      caracteristicas.includes(
        "marca: renogy"
      );

    if (
      esRenogy &&
      subcategoria
    ) {
      renogySubs.add(
        subcategoria
      );
    }
  }

  const orden = [
    "renogy",
    "energia solar",
    "reguladores",
    "inversores",
    "baterias",
    "cargadores",
    "electricidad",
    "electrodomesticos",
    "heladeras",
    "climatizacion",
    "calefaccion",
    "cocina",
    "aberturas",
    "ventilacion",
    "herrajes",
    "mobiliario",
    "seguridad",
    "sanitarios",
    "griferia",
    "agua"
  ];

  const normalizar =
    valor =>
      String(valor || "")
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .toLowerCase();

  const salida =
    [...mapa.values()]
      .map(item => ({
        nombre: item.nombre,
        slug: item.slug,
        subcategorias:
          [...item.subcategorias]
            .sort((a, b) =>
              a.localeCompare(
                b,
                "es"
              )
            )
      }));

  if (renogySubs.size) {
    salida.unshift({
      nombre: "Renogy",
      slug: "renogy",
      subcategorias:
        [...renogySubs]
          .sort((a, b) =>
            a.localeCompare(
              b,
              "es"
            )
          )
    });
  }

  salida.sort((a, b) => {
    const na =
      normalizar(a.nombre);
    const nb =
      normalizar(b.nombre);

    const ia =
      orden.indexOf(na);
    const ib =
      orden.indexOf(nb);

    const va =
      ia === -1
        ? 999
        : ia;

    const vb =
      ib === -1
        ? 999
        : ib;

    if (va !== vb) {
      return va - vb;
    }

    return a.nombre.localeCompare(
      b.nombre,
      "es"
    );
  });

  return salida;
}

// ------------------------------------------------------------
// CATÁLOGO PÚBLICO DINÁMICO
// ------------------------------------------------------------

router.get(
  "/catalogo-categorias",
  async (req, res) => {
    try {
      const [rows] =
        await db.promise().query(
          `
            SELECT
              codigo,
              nombre,
              categoria,
              subcategoria,
              caracteristicas
            FROM productos
            WHERE categoria IS NOT NULL
              AND TRIM(categoria) <> ''
            ORDER BY
              categoria,
              subcategoria,
              nombre
          `
        );

      return res.json({
        ok: true,
        categorias:
          construirCatalogo(rows)
      });
    } catch (error) {
      console.error(
        "Error cargando catálogo dinámico:",
        error
      );

      return res.status(500).json({
        ok: false,
        mensaje:
          "No se pudieron cargar las categorías."
      });
    }
  }
);

// ------------------------------------------------------------
// PRODUCTOS ADMIN
// ------------------------------------------------------------

router.get(
  "/admin/productos-autonomo",
  autenticarAdmin,
  async (req, res) => {
    try {
      const [rows] =
        await db.promise().query(
          `
            SELECT
              id,
              codigo,
              nombre,
              categoria,
              subcategoria,
              descripcion,
              caracteristicas,
              precio,
              stock,
              imagen,
              destacado
            FROM productos
            ORDER BY id DESC
          `
        );

      return res.json({
        ok: true,
        productos: rows
      });
    } catch (error) {
      console.error(
        "Error listando productos admin:",
        error
      );

      return res.status(500).json({
        ok: false,
        mensaje:
          "No se pudieron cargar los productos."
      });
    }
  }
);

router.post(
  "/admin/productos-autonomo",
  autenticarAdmin,
  async (req, res) => {
    try {
      const nombre =
        limpiarTexto(
          req.body?.nombre,
          250
        );

      const categoria =
        limpiarTexto(
          req.body?.categoria,
          120
        );

      const subcategoria =
        limpiarTexto(
          req.body?.subcategoria,
          160
        );

      const descripcion =
        limpiarTexto(
          req.body?.descripcion,
          6000
        );

      const caracteristicas =
        limpiarTexto(
          req.body?.caracteristicas,
          10000
        );

      const imagen =
        limpiarTexto(
          req.body?.imagen,
          1000
        );

      let codigo =
        limpiarTexto(
          req.body?.codigo,
          120
        );

      if (!nombre) {
        return res.status(400).json({
          ok: false,
          mensaje:
            "El nombre del producto es obligatorio."
        });
      }

      if (!categoria) {
        return res.status(400).json({
          ok: false,
          mensaje:
            "La categoría es obligatoria."
        });
      }

      if (!codigo) {
        codigo =
          "ADM." +
          Date.now().toString(36)
            .toUpperCase();
      }

      const [duplicados] =
        await db.promise().query(
          `
            SELECT id
            FROM productos
            WHERE codigo = ?
            LIMIT 1
          `,
          [codigo]
        );

      if (duplicados.length) {
        return res.status(409).json({
          ok: false,
          mensaje:
            "Ya existe un producto con ese código."
        });
      }

      const [resultado] =
        await db.promise().query(
          `
            INSERT INTO productos
            (
              codigo,
              nombre,
              categoria,
              subcategoria,
              descripcion,
              caracteristicas,
              precio,
              stock,
              imagen,
              destacado
            )
            VALUES
            (?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
          `,
          [
            codigo,
            nombre,
            categoria,
            subcategoria || null,
            descripcion,
            caracteristicas,
            imagen || null,
            Number(
              req.body?.destacado
            )
              ? 1
              : 0
          ]
        );

      return res.status(201).json({
        ok: true,
        mensaje:
          "Producto agregado correctamente.",
        id: resultado.insertId,
        codigo
      });
    } catch (error) {
      console.error(
        "Error creando producto admin:",
        error
      );

      return res.status(500).json({
        ok: false,
        mensaje:
          "No se pudo crear el producto."
      });
    }
  }
);

router.put(
  "/admin/productos-autonomo/:id",
  autenticarAdmin,
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          ok: false,
          mensaje:
            "Producto inválido."
        });
      }

      const nombre =
        limpiarTexto(
          req.body?.nombre,
          250
        );

      const categoria =
        limpiarTexto(
          req.body?.categoria,
          120
        );

      const subcategoria =
        limpiarTexto(
          req.body?.subcategoria,
          160
        );

      const descripcion =
        limpiarTexto(
          req.body?.descripcion,
          6000
        );

      const caracteristicas =
        limpiarTexto(
          req.body?.caracteristicas,
          10000
        );

      const imagen =
        limpiarTexto(
          req.body?.imagen,
          1000
        );

      const codigo =
        limpiarTexto(
          req.body?.codigo,
          120
        );

      if (!nombre || !categoria) {
        return res.status(400).json({
          ok: false,
          mensaje:
            "Nombre y categoría son obligatorios."
        });
      }

      if (codigo) {
        const [duplicados] =
          await db.promise().query(
            `
              SELECT id
              FROM productos
              WHERE codigo = ?
                AND id <> ?
              LIMIT 1
            `,
            [
              codigo,
              id
            ]
          );

        if (duplicados.length) {
          return res.status(409).json({
            ok: false,
            mensaje:
              "Ya existe otro producto con ese código."
          });
        }
      }

      const [resultado] =
        await db.promise().query(
          `
            UPDATE productos
            SET
              codigo = ?,
              nombre = ?,
              categoria = ?,
              subcategoria = ?,
              descripcion = ?,
              caracteristicas = ?,
              precio = 0,
              imagen = ?,
              destacado = ?
            WHERE id = ?
          `,
          [
            codigo || null,
            nombre,
            categoria,
            subcategoria || null,
            descripcion,
            caracteristicas,
            imagen || null,
            Number(
              req.body?.destacado
            )
              ? 1
              : 0,
            id
          ]
        );

      if (!resultado.affectedRows) {
        return res.status(404).json({
          ok: false,
          mensaje:
            "Producto no encontrado."
        });
      }

      return res.json({
        ok: true,
        mensaje:
          "Producto actualizado correctamente."
      });
    } catch (error) {
      console.error(
        "Error editando producto admin:",
        error
      );

      return res.status(500).json({
        ok: false,
        mensaje:
          "No se pudo actualizar el producto."
      });
    }
  }
);

router.delete(
  "/admin/productos-autonomo/:id",
  autenticarAdmin,
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          ok: false,
          mensaje:
            "Producto inválido."
        });
      }

      const [resultado] =
        await db.promise().query(
          "DELETE FROM productos WHERE id = ?",
          [id]
        );

      if (!resultado.affectedRows) {
        return res.status(404).json({
          ok: false,
          mensaje:
            "Producto no encontrado."
        });
      }

      return res.json({
        ok: true,
        mensaje:
          "Producto eliminado correctamente."
      });
    } catch (error) {
      console.error(
        "Error eliminando producto admin:",
        error
      );

      return res.status(500).json({
        ok: false,
        mensaje:
          "No se pudo eliminar el producto."
      });
    }
  }
);

// ------------------------------------------------------------
// CLOUDINARY
// ------------------------------------------------------------

router.post(
  "/admin/productos-autonomo/upload",
  autenticarAdmin,
  upload.single("imagen"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          ok: false,
          mensaje:
            "Seleccioná una imagen."
        });
      }

      const cloudName =
        String(
          process.env.CLOUDINARY_CLOUD_NAME || ""
        ).trim();

      const apiKey =
        String(
          process.env.CLOUDINARY_API_KEY || ""
        ).trim();

      const apiSecret =
        String(
          process.env.CLOUDINARY_API_SECRET || ""
        ).trim();

      if (
        !cloudName ||
        !apiKey ||
        !apiSecret
      ) {
        return res.status(500).json({
          ok: false,
          mensaje:
            "Cloudinary no está configurado en el servidor."
        });
      }

      const timestamp =
        Math.floor(
          Date.now() / 1000
        );

      const folder =
        "rc-conversiones/productos";

      const firmaBase =
        `folder=${folder}&timestamp=${timestamp}${apiSecret}`;

      const signature =
        crypto
          .createHash("sha1")
          .update(firmaBase)
          .digest("hex");

      const form =
        new FormData();

      form.append(
        "file",
        new Blob(
          [req.file.buffer],
          {
            type:
              req.file.mimetype
          }
        ),
        req.file.originalname
      );

      form.append(
        "api_key",
        apiKey
      );

      form.append(
        "timestamp",
        String(timestamp)
      );

      form.append(
        "folder",
        folder
      );

      form.append(
        "signature",
        signature
      );

      const response =
        await fetch(
          `https://api.cloudinary.com/v1_1/${encodeURIComponent(
            cloudName
          )}/image/upload`,
          {
            method: "POST",
            body: form
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.secure_url
      ) {
        console.error(
          "Cloudinary respondió:",
          data
        );

        return res.status(502).json({
          ok: false,
          mensaje:
            data?.error?.message ||
            "Cloudinary rechazó la imagen."
        });
      }

      return res.json({
        ok: true,
        ruta: data.secure_url,
        public_id: data.public_id
      });
    } catch (error) {
      console.error(
        "Error subiendo imagen a Cloudinary:",
        error
      );

      return res.status(500).json({
        ok: false,
        mensaje:
          "No se pudo subir la imagen."
      });
    }
  }
);

router.use(
  (
    error,
    req,
    res,
    next
  ) => {
    if (
      error &&
      (
        error.code ===
          "LIMIT_FILE_SIZE" ||
        error.message
      )
    ) {
      return res.status(400).json({
        ok: false,
        mensaje:
          error.code ===
          "LIMIT_FILE_SIZE"
            ? "La imagen supera el máximo de 8 MB."
            : error.message
      });
    }

    next(error);
  }
);

module.exports = router;
