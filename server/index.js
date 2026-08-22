const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

dotenv.config();

const db = require("./config/db");
const multer = require("./config/multer");
const clientesRoutes = require("./routes/clientes");

const app = express();


// =====================================================
// SEGURIDAD ADMINISTRADOR
// =====================================================

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN =
    process.env.JWT_EXPIRES_IN || "8h";

if (
    !JWT_SECRET ||
    JWT_SECRET.length < 32
) {
    console.error(
        "❌ Falta JWT_SECRET o es demasiado corto en el archivo .env."
    );
    process.exit(1);
}

function autenticarAdmin(req, res, next) {

    const authorization =
        req.headers.authorization || "";

    if (
        !authorization.startsWith(
            "Bearer "
        )
    ) {
        return res.status(401).json({
            ok: false,
            codigo: "TOKEN_FALTANTE",
            mensaje:
                "Tenés que iniciar sesión como administrador."
        });
    }

    const token =
        authorization
            .slice(7)
            .trim();

    if (!token) {
        return res.status(401).json({
            ok: false,
            codigo: "TOKEN_FALTANTE",
            mensaje:
                "Tenés que iniciar sesión como administrador."
        });
    }

    try {

        const datos = jwt.verify(
            token,
            JWT_SECRET
        );

        if (
            !datos ||
            datos.tipo !== "admin"
        ) {
            return res.status(403).json({
                ok: false,
                codigo: "TOKEN_SIN_PERMISO",
                mensaje:
                    "No tenés permisos de administrador."
            });
        }

        req.admin = datos;

        return next();

    } catch (error) {

        const vencido =
            error?.name ===
            "TokenExpiredError";

        return res.status(401).json({
            ok: false,
            codigo:
                vencido
                    ? "TOKEN_VENCIDO"
                    : "TOKEN_INVALIDO",
            mensaje:
                vencido
                    ? "Tu sesión de administrador venció. Iniciá sesión nuevamente."
                    : "La sesión de administrador no es válida."
        });
    }
}

function nombreAdminAutenticado(req) {

    return (
        req.admin?.nombre ||
        req.admin?.usuario ||
        "Administrador"
    );
}


// =====================================================
// SEGURIDAD CLIENTE
// =====================================================

function autenticarCliente(req, res, next) {

    const authorization =
        req.headers.authorization || "";

    if (
        !authorization.startsWith(
            "Bearer "
        )
    ) {
        return res.status(401).json({
            ok: false,
            codigo:
                "TOKEN_CLIENTE_FALTANTE",
            mensaje:
                "Tenés que iniciar sesión."
        });
    }

    const token =
        authorization
            .slice(7)
            .trim();

    if (!token) {
        return res.status(401).json({
            ok: false,
            codigo:
                "TOKEN_CLIENTE_FALTANTE",
            mensaje:
                "Tenés que iniciar sesión."
        });
    }

    try {

        const datos =
            jwt.verify(
                token,
                JWT_SECRET
            );

        if (
            !datos ||
            datos.tipo !== "cliente"
        ) {
            return res.status(403).json({
                ok: false,
                codigo:
                    "TOKEN_CLIENTE_SIN_PERMISO",
                mensaje:
                    "La sesión no corresponde a un cliente."
            });
        }

        req.cliente =
            datos;

        return next();

    } catch (error) {

        const vencido =
            error?.name ===
            "TokenExpiredError";

        return res.status(401).json({
            ok: false,

            codigo:
                vencido
                    ? "TOKEN_CLIENTE_VENCIDO"
                    : "TOKEN_CLIENTE_INVALIDO",

            mensaje:
                vencido
                    ? "Tu sesión venció. Iniciá sesión nuevamente."
                    : "Tu sesión no es válida. Iniciá sesión nuevamente."
        });
    }
}


// =====================================================
// CONFIGURACIÓN GENERAL Y HARDENING
// =====================================================

const NODE_ENV =
    process.env.NODE_ENV ||
    "development";

const FRONTEND_URL =
    String(
        process.env.FRONTEND_URL ||
        "http://localhost:5173"
    )
        .trim()
        .replace(/\/+$/, "");

const origenesDesdeEnv =
    String(
        process.env.CORS_ORIGINS ||
        FRONTEND_URL
    )
        .split(",")
        .map((origen) =>
            origen
                .trim()
                .replace(/\/+$/, "")
        )
        .filter(Boolean);

const ORIGENES_PERMITIDOS =
    new Set(
        origenesDesdeEnv
    );

if (
    NODE_ENV !== "production"
) {
    ORIGENES_PERMITIDOS.add(
        "http://localhost:5173"
    );
}

if (
    NODE_ENV === "production" &&
    ORIGENES_PERMITIDOS.size === 0
) {
    console.error(
        "❌ En producción tenés que configurar FRONTEND_URL o CORS_ORIGINS."
    );
    process.exit(1);
}


// -----------------------------------------
// CABECERAS DE SEGURIDAD
// -----------------------------------------

app.disable("x-powered-by");

app.use(
    helmet({
        crossOriginResourcePolicy: {
            policy:
                "cross-origin"
        }
    })
);


// -----------------------------------------
// CORS
// -----------------------------------------

app.use(
    cors({
        origin: (
            origin,
            callback
        ) => {

            // Permite herramientas locales sin header Origin
            // y navegadores provenientes del frontend autorizado.
            if (!origin) {
                return callback(
                    null,
                    true
                );
            }

            const origenNormalizado =
                String(origin)
                    .trim()
                    .replace(
                        /\/+$/,
                        ""
                    );

            if (
                ORIGENES_PERMITIDOS.has(
                    origenNormalizado
                )
            ) {
                return callback(
                    null,
                    true
                );
            }

            return callback(
                null,
                false
            );
        },

        methods: [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);


// -----------------------------------------
// LÍMITE DE CUERPO JSON
// -----------------------------------------

app.use(
    express.json({
        limit:
            "1mb"
    })
);

app.use(
    express.urlencoded({
        extended:
            true,
        limit:
            "1mb"
    })
);


// -----------------------------------------
// PROTECCIÓN CONTRA FUERZA BRUTA
// -----------------------------------------

function crearLimiter({
    windowMs,
    limit,
    mensaje
}) {

    return rateLimit({
        windowMs,
        limit,

        standardHeaders:
            "draft-7",

        legacyHeaders:
            false,

        message: {
            ok:
                false,

            mensaje
        }
    });
}


const adminLoginLimiter =
    crearLimiter({
        windowMs:
            15 * 60 * 1000,

        limit:
            10,

        mensaje:
            "Demasiados intentos de ingreso al panel. Esperá unos minutos e intentá nuevamente."
    });


const clienteLoginLimiter =
    crearLimiter({
        windowMs:
            15 * 60 * 1000,

        limit:
            12,

        mensaje:
            "Demasiados intentos de inicio de sesión. Esperá unos minutos e intentá nuevamente."
    });


const registroClienteLimiter =
    crearLimiter({
        windowMs:
            60 * 60 * 1000,

        limit:
            8,

        mensaje:
            "Se realizaron demasiados registros desde esta conexión. Intentá nuevamente más tarde."
    });


const crearTicketLimiter =
    crearLimiter({
        windowMs:
            60 * 60 * 1000,

        limit:
            30,

        mensaje:
            "Se generaron demasiadas solicitudes en poco tiempo. Intentá nuevamente más tarde."
    });


app.use(
    "/login",
    adminLoginLimiter
);

app.use(
    "/clientes/login",
    clienteLoginLimiter
);

app.use(
    "/clientes/registro",
    registroClienteLimiter
);


app.use(
    "/clientes",
    clientesRoutes
);


// =====================================================
// ARCHIVOS E IMÁGENES
// =====================================================

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);

app.use(
    "/images",
    express.static(
        path.join(
            __dirname,
            "public/images"
        )
    )
);


// =====================================================
// SUBIR IMAGEN
// =====================================================

app.post(
    "/upload",
    autenticarAdmin,
    multer.single("imagen"),
    (req, res) => {

        if (!req.file) {

            return res.status(400).json({

                ok: false,

                mensaje:
                    "No se subió ninguna imagen."

            });

        }

        res.json({

            ok: true,

            ruta:
                `/uploads/${req.file.filename}`

        });

    }
);


// =====================================================
// INICIO
// =====================================================

app.get("/", (req, res) => {

    res.json({

        ok: true,

        mensaje:
            "Servidor RC Conversiones funcionando."

    });

});


// =====================================================
// PRODUCTOS
// =====================================================


// OBTENER PRODUCTOS

app.get("/productos", (req, res) => {

    db.query(
        `
        SELECT *
        FROM productos
        ORDER BY id DESC
        `,
        (err, resultados) => {

            if (err) {

                console.error(
                    "Error obteniendo productos:",
                    err
                );

                return res.status(500).json({

                    ok: false,

                    mensaje:
                        "No se pudieron obtener los productos."

                });

            }

            res.json(resultados);

        }
    );

});


// AGREGAR PRODUCTO

app.post("/productos", autenticarAdmin, (req, res) => {

    const {

        nombre,
        categoria,
        precio,
        stock,
        descripcion,
        imagen,
        destacado

    } = req.body;


    if (!nombre) {

        return res.status(400).json({

            ok: false,

            mensaje:
                "El nombre del producto es obligatorio."

        });

    }


    const sql = `
        INSERT INTO productos
        (
            nombre,
            categoria,
            precio,
            stock,
            descripcion,
            imagen,
            destacado
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;


    db.query(
        sql,
        [
            nombre,
            categoria,
            precio,
            stock,
            descripcion,
            imagen,
            destacado
        ],
        (err, resultado) => {

            if (err) {

                console.error(
                    "Error agregando producto:",
                    err
                );

                return res.status(500).json({

                    ok: false,

                    mensaje:
                        "No se pudo agregar el producto."

                });

            }


            res.json({

                ok: true,

                mensaje:
                    "Producto agregado correctamente.",

                id:
                    resultado.insertId

            });

        }
    );

});


// EDITAR PRODUCTO

app.put(
    "/productos/:id",
    autenticarAdmin,
    (req, res) => {

        const { id } =
            req.params;


        const {

            nombre,
            categoria,
            precio,
            stock,
            descripcion,
            imagen,
            destacado

        } = req.body;


        const sql = `
            UPDATE productos
            SET
                nombre = ?,
                categoria = ?,
                precio = ?,
                stock = ?,
                descripcion = ?,
                imagen = ?,
                destacado = ?
            WHERE id = ?
        `;


        db.query(
            sql,
            [
                nombre,
                categoria,
                precio,
                stock,
                descripcion,
                imagen,
                destacado,
                id
            ],
            (err, resultado) => {

                if (err) {

                    console.error(
                        "Error actualizando producto:",
                        err
                    );

                    return res.status(500).json({

                        ok: false,

                        mensaje:
                            "No se pudo actualizar el producto."

                    });

                }


                if (
                    resultado.affectedRows === 0
                ) {

                    return res.status(404).json({

                        ok: false,

                        mensaje:
                            "Producto no encontrado."

                    });

                }


                res.json({

                    ok: true,

                    mensaje:
                        "Producto actualizado correctamente."

                });

            }
        );

    }
);


// ELIMINAR PRODUCTO

app.delete(
    "/productos/:id",
    autenticarAdmin,
    (req, res) => {

        const { id } =
            req.params;


        db.query(
            "DELETE FROM productos WHERE id = ?",
            [id],
            (err, resultado) => {

                if (err) {

                    console.error(
                        "Error eliminando producto:",
                        err
                    );

                    return res.status(500).json({

                        ok: false,

                        mensaje:
                            "No se pudo eliminar el producto."

                    });

                }


                if (
                    resultado.affectedRows === 0
                ) {

                    return res.status(404).json({

                        ok: false,

                        mensaje:
                            "Producto no encontrado."

                    });

                }


                res.json({

                    ok: true,

                    mensaje:
                        "Producto eliminado correctamente."

                });

            }
        );

    }
);


// =====================================================
// LOGIN ADMINISTRADOR
// =====================================================

app.post(
    "/login",
    async (req, res) => {

        const usuario =
            String(
                req.body?.usuario || ""
            ).trim();

        const password =
            String(
                req.body?.password || ""
            );

        if (!usuario || !password) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "Completá usuario y contraseña."
            });
        }

        try {

            const [resultados] =
                await db.promise().query(
                    `
                        SELECT *
                        FROM administradores
                        WHERE usuario = ?
                        LIMIT 1
                    `,
                    [usuario]
                );

            if (
                !resultados ||
                resultados.length === 0
            ) {
                return res.status(401).json({
                    ok: false,
                    mensaje:
                        "Usuario o contraseña incorrectos."
                });
            }

            const administrador =
                resultados[0];

            const passwordGuardada =
                String(
                    administrador.password || ""
                );

            const esHashBcrypt =
                /^\$2[aby]\$\d{2}\$/.test(
                    passwordGuardada
                );

            let passwordValida = false;

            if (esHashBcrypt) {

                passwordValida =
                    await bcrypt.compare(
                        password,
                        passwordGuardada
                    );

            } else {

                // Compatibilidad temporal con la contraseña
                // antigua en texto plano. Si es correcta,
                // se actualiza automáticamente a bcrypt.
                passwordValida =
                    password ===
                    passwordGuardada;

                if (passwordValida) {

                    const nuevoHash =
                        await bcrypt.hash(
                            password,
                            12
                        );

                    await db.promise().query(
                        `
                            UPDATE administradores
                            SET password = ?
                            WHERE usuario = ?
                        `,
                        [
                            nuevoHash,
                            administrador.usuario
                        ]
                    );

                    console.log(
                        `🔐 Contraseña de ${administrador.usuario} migrada a bcrypt.`
                    );
                }
            }

            if (!passwordValida) {
                return res.status(401).json({
                    ok: false,
                    mensaje:
                        "Usuario o contraseña incorrectos."
                });
            }

            const administradorSeguro = {
                ...administrador
            };

            delete administradorSeguro.password;

            const token = jwt.sign(
                {
                    id:
                        administrador.id,
                    usuario:
                        administrador.usuario,
                    nombre:
                        administrador.nombre ||
                        administrador.usuario,
                    tipo:
                        "admin"
                },
                JWT_SECRET,
                {
                    expiresIn:
                        JWT_EXPIRES_IN
                }
            );

            return res.json({
                ok: true,
                administrador:
                    administradorSeguro,
                token
            });

        } catch (error) {

            console.error(
                "Error en login administrador:",
                error
            );

            return res.status(500).json({
                ok: false,
                mensaje:
                    "No se pudo iniciar sesión."
            });
        }
    }
);


// =====================================================
// VALIDAR SESIÓN ADMINISTRADOR
// =====================================================

app.get(
    "/admin/validar-token",
    autenticarAdmin,
    (req, res) => {

        return res.json({
            ok: true,
            administrador: {
                id:
                    req.admin.id,
                usuario:
                    req.admin.usuario,
                nombre:
                    req.admin.nombre
            }
        });
    }
);


// =====================================================
// VENDEDORES
// =====================================================

// OBTENER VENDEDORES DISPONIBLES
app.get("/vendedores", autenticarAdmin, (req, res) => {

    const sql = `
        SELECT
            id,
            nombre,
            telefono
        FROM vendedores
        WHERE activo = 1
        ORDER BY nombre ASC
    `;

    db.query(sql, (err, resultados) => {

        if (err) {

            console.error(
                "❌ Error obteniendo vendedores:",
                err
            );

            return res.status(500).json({
                ok: false,
                mensaje:
                    "No se pudieron obtener los vendedores.",
                error: err.message
            });
        }

        console.log(
            `👥 Vendedores disponibles: ${resultados.length}`
        );

        return res.json({
            ok: true,
            vendedores: resultados
        });

    });

});

// =====================================================
// PRESUPUESTOS
// =====================================================

// =====================================================
// GUARDAR PRESUPUESTO / GENERAR TICKET
// TRANSACCIÓN: TICKET + HISTORIAL INICIAL
// =====================================================

app.post(
    "/presupuestos",
    crearTicketLimiter,
    autenticarCliente,
    async (req, res) => {

        const {
            codigo,
            productos,
            total
        } = req.body;


        if (!codigo) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "No se recibió el código del ticket."
            });

        }


        if (
            !Array.isArray(productos) ||
            productos.length === 0
        ) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "El ticket no contiene productos."
            });

        }


        const clienteId =
            req.cliente.id;


        let connection;


        try {

            connection =
                await db.promise().getConnection();


            await connection.beginTransaction();


            // ==========================================
            // OBTENER CLIENTE DESDE EL TOKEN
            // NO SE CONFÍA EN cliente_id/nombre/teléfono
            // RECIBIDOS DESDE EL NAVEGADOR
            // ==========================================

            const [clientes] =
                await connection.query(
                    `
                        SELECT
                            id,
                            nombre,
                            telefono,
                            verificado
                        FROM clientes
                        WHERE id = ?
                        LIMIT 1
                    `,
                    [clienteId]
                );


            if (
                !clientes ||
                clientes.length === 0
            ) {

                await connection.rollback();

                return res.status(401).json({
                    ok: false,
                    mensaje:
                        "La cuenta del cliente no existe."
                });

            }


            const clienteReal =
                clientes[0];


            if (
                Number(
                    clienteReal.verificado
                ) !== 1
            ) {

                await connection.rollback();

                return res.status(403).json({
                    ok: false,
                    mensaje:
                        "La cuenta todavía no está verificada."
                });

            }


            const sqlTicket = `
                INSERT INTO presupuestos
                (
                    cliente_id,
                    vendedor_id,
                    codigo,
                    cliente,
                    telefono,
                    productos,
                    total,
                    estado
                )
                VALUES (?, NULL, ?, ?, ?, ?, ?, ?)
            `;


            const [resultado] =
                await connection.query(
                    sqlTicket,
                    [
                        clienteReal.id,
                        codigo,
                        clienteReal.nombre,
                        clienteReal.telefono,
                        JSON.stringify(
                            productos
                        ),
                        Number(total) || 0,
                        "Pendiente"
                    ]
                );


            const ticketId =
                resultado.insertId;


            const sqlHistorial = `
                INSERT INTO presupuesto_historial
                (
                    presupuesto_id,
                    estado
                )
                VALUES (?, ?)
            `;


            await connection.query(
                sqlHistorial,
                [
                    ticketId,
                    "Pendiente"
                ]
            );


            await connection.commit();


            console.log(
                `✅ Ticket ${codigo} guardado para cliente ${clienteReal.id}`
            );


            return res.json({
                ok: true,
                mensaje:
                    "Solicitud recibida correctamente.",
                id:
                    ticketId,
                codigo,
                estado:
                    "Pendiente"
            });


        } catch (error) {

            if (connection) {

                try {

                    await connection.rollback();

                } catch (rollbackError) {

                    console.error(
                        "Error haciendo rollback del ticket:",
                        rollbackError
                    );

                }

            }


            console.error(
                "Error guardando ticket:",
                error
            );


            if (
                error.code ===
                "ER_DUP_ENTRY"
            ) {

                return res.status(409).json({
                    ok: false,
                    mensaje:
                        "Ya existe un ticket con ese código."
                });

            }


            return res.status(500).json({
                ok: false,
                mensaje:
                    "No se pudo guardar el presupuesto. No se realizó ningún cambio."
            });


        } finally {

            if (connection) {
                connection.release();
            }

        }

    }
);

// =====================================================
// LISTADO DE TICKETS PARA ADMINISTRACIÓN
// =====================================================

app.get(
    "/presupuestos-admin",
    autenticarAdmin,
    (req, res) => {

        const sql = `
            SELECT
                p.id,
                p.codigo,
                p.cliente_id,
                p.vendedor_id,
                p.cliente,
                p.telefono,
                p.productos,
                p.total,
                p.estado,
                p.nota_admin,
                p.atendido_por,
                p.ultimo_contacto,
                p.proximo_seguimiento,
                p.fecha,

                v.nombre AS vendedor_nombre,
                v.telefono AS vendedor_telefono,

                ultimo_contacto.medio AS ultimo_medio_contacto

            FROM presupuestos p

            LEFT JOIN vendedores v
                ON p.vendedor_id = v.id

            LEFT JOIN (
                SELECT
                    pc.presupuesto_id,
                    pc.medio
                FROM presupuesto_contactos pc

                INNER JOIN (
                    SELECT
                        presupuesto_id,
                        MAX(id) AS ultimo_id
                    FROM presupuesto_contactos
                    GROUP BY presupuesto_id
                ) ultimos

                    ON pc.id = ultimos.ultimo_id

            ) ultimo_contacto

                ON ultimo_contacto.presupuesto_id = p.id

            ORDER BY p.id DESC
        `;

        db.query(
            sql,
            (err, resultados) => {

                if (err) {

                    console.error(
                        "Error obteniendo tickets:",
                        err
                    );

                    return res.status(500).json({
                        ok: false,
                        mensaje:
                            "No se pudieron obtener los tickets."
                    });

                }

                return res.json({
                    ok: true,
                    presupuestos:
                        resultados || []
                });

            }
        );

    }
);

// =====================================================
// TICKETS DEL CLIENTE
// =====================================================

app.get(
    "/presupuestos/cliente/:cliente_id",
    autenticarCliente,
    (req, res) => {

        const { cliente_id } =
            req.params;


        if (
            String(cliente_id) !==
            String(req.cliente.id)
        ) {

            return res.status(403).json({
                ok: false,
                mensaje:
                    "No tenés permiso para ver los tickets de otra cuenta."
            });

        }


        const sql = `
            SELECT
                id,
                cliente_id,
                codigo,
                cliente,
                telefono,
                productos,
                total,
                estado,
                fecha
            FROM presupuestos
            WHERE cliente_id = ?
            ORDER BY id DESC
        `;


        db.query(
            sql,
            [req.cliente.id],
            (err, resultados) => {

                if (err) {

                    console.error(
                        "Error obteniendo tickets del cliente:",
                        err
                    );


                    return res.status(500).json({
                        ok: false,
                        mensaje:
                            "No se pudieron obtener los tickets."
                    });

                }


                return res.json({
                    ok: true,
                    presupuestos:
                        resultados || []
                });

            }
        );

    }
);

// =====================================================
// HISTORIAL DE UN PRESUPUESTO DEL CLIENTE
// =====================================================

app.get(
    "/presupuestos/cliente/:cliente_id/:id/historial",
    autenticarCliente,
    (req, res) => {

        const {
            cliente_id,
            id
        } = req.params;


        if (
            String(cliente_id) !==
            String(req.cliente.id)
        ) {

            return res.status(403).json({
                ok: false,
                mensaje:
                    "No tenés permiso para ver este historial."
            });

        }


        const sqlPresupuesto = `
            SELECT id
            FROM presupuestos
            WHERE id = ?
              AND cliente_id = ?
            LIMIT 1
        `;


        db.query(
            sqlPresupuesto,
            [
                id,
                req.cliente.id
            ],
            (err, presupuestos) => {

                if (err) {

                    console.error(
                        "Error verificando presupuesto del cliente:",
                        err
                    );


                    return res.status(500).json({
                        ok: false,
                        mensaje:
                            "No se pudo verificar el ticket."
                    });

                }


                if (
                    !presupuestos ||
                    presupuestos.length === 0
                ) {

                    return res.status(404).json({
                        ok: false,
                        mensaje:
                            "Ticket no encontrado."
                    });

                }


                const sqlHistorial = `
                    SELECT
                        id,
                        presupuesto_id,
                        estado,
                        fecha
                    FROM presupuesto_historial
                    WHERE presupuesto_id = ?
                    ORDER BY id ASC
                `;


                db.query(
                    sqlHistorial,
                    [id],
                    (err, historial) => {

                        if (err) {

                            console.error(
                                "Error obteniendo historial del cliente:",
                                err
                            );


                            return res.status(500).json({
                                ok: false,
                                mensaje:
                                    "No se pudo obtener el historial."
                            });

                        }


                        return res.json({
                            ok: true,
                            historial:
                                historial || []
                        });

                    }
                );

            }
        );

    }
);

// DETALLE DE PRESUPUESTO

app.get(
    "/presupuestos-admin/:id",
    autenticarAdmin,
    (req, res) => {

        const { id } =
            req.params;


        db.query(
            `
            SELECT *
            FROM presupuestos
            WHERE id = ?
            `,
            [id],
            (err, resultados) => {

                if (err) {

                    console.error(
                        "Error obteniendo presupuesto:",
                        err
                    );

                    return res.status(500).json({

                        ok: false,

                        mensaje:
                            "No se pudo obtener el presupuesto."

                    });

                }


                if (
                    resultados.length === 0
                ) {

                    return res.status(404).json({

                        ok: false,

                        mensaje:
                            "Presupuesto no encontrado."

                    });

                }


                res.json({

                    ok: true,

                    presupuesto:
                        resultados[0]

                });

            }
        );

    }
);


// =====================================================
// CAMBIAR ESTADO DEL TICKET
// TRANSACCIÓN: ESTADO + HISTORIAL + CONTACTO/SEGUIMIENTO
// =====================================================

app.put(
    "/presupuestos/:id/estado",
    autenticarAdmin,
    async (req, res) => {

        const { id } = req.params;

        const {
            estado,
            atendido_por
        } = req.body;

        const estadosPermitidos = [
            "Pendiente",
            "Contactado",
            "En revisión",
            "Aprobado",
            "Rechazado"
        ];

        if (
            !estadosPermitidos.includes(
                estado
            )
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "Estado no válido."
            });
        }

        let connection;

        try {

            connection =
                await db.promise().getConnection();

            await connection.beginTransaction();

            const [tickets] =
                await connection.query(
                    `
                        SELECT
                            id,
                            estado,
                            ultimo_contacto,
                            atendido_por,
                            proximo_seguimiento
                        FROM presupuestos
                        WHERE id = ?
                        LIMIT 1
                        FOR UPDATE
                    `,
                    [id]
                );

            if (
                !tickets ||
                tickets.length === 0
            ) {
                await connection.rollback();

                return res.status(404).json({
                    ok: false,
                    mensaje:
                        "Ticket no encontrado."
                });
            }

            const ticketActual =
                tickets[0];

            const estadoAnterior =
                ticketActual.estado ||
                "Pendiente";

            if (
                estadoAnterior ===
                estado
            ) {
                await connection.commit();

                return res.json({
                    ok: true,
                    mensaje:
                        "El ticket ya tiene ese estado.",
                    estado: estadoAnterior,
                    proximo_seguimiento:
                        ticketActual.proximo_seguimiento
                });
            }

            const administrador =
                nombreAdminAutenticado(req);

            const necesitaRegistrarContacto =
                estado === "Contactado" &&
                !ticketActual.ultimo_contacto;

            const esEstadoFinal =
                estado === "Aprobado" ||
                estado === "Rechazado";

            const tieneSeguimientoActivo =
                Boolean(
                    ticketActual.proximo_seguimiento
                );

            if (necesitaRegistrarContacto) {

                await connection.query(
                    `
                        UPDATE presupuestos
                        SET
                            estado = ?,
                            atendido_por = ?,
                            ultimo_contacto = NOW()
                        WHERE id = ?
                    `,
                    [
                        estado,
                        administrador,
                        id
                    ]
                );

            } else if (esEstadoFinal) {

                await connection.query(
                    `
                        UPDATE presupuestos
                        SET
                            estado = ?,
                            proximo_seguimiento = NULL
                        WHERE id = ?
                    `,
                    [estado, id]
                );

            } else {

                await connection.query(
                    `
                        UPDATE presupuestos
                        SET estado = ?
                        WHERE id = ?
                    `,
                    [estado, id]
                );

            }

            await connection.query(
                `
                    INSERT INTO presupuesto_historial
                    (
                        presupuesto_id,
                        estado
                    )
                    VALUES (?, ?)
                `,
                [id, estado]
            );

            if (necesitaRegistrarContacto) {

                await connection.query(
                    `
                        INSERT INTO presupuesto_contactos
                        (
                            presupuesto_id,
                            atendido_por,
                            medio
                        )
                        VALUES (?, ?, ?)
                    `,
                    [
                        id,
                        administrador,
                        "Manual"
                    ]
                );

            }

            let seguimientoCancelado = false;

            if (
                esEstadoFinal &&
                tieneSeguimientoActivo
            ) {

                const motivoCierreSeguimiento =
                    estado === "Aprobado"
                        ? "Ticket aprobado"
                        : "Ticket rechazado";

                const [resultadoSeguimiento] =
                    await connection.query(
                        `
                            UPDATE presupuesto_seguimientos
                            SET
                                estado = 'Cancelado',
                                motivo_cierre = ?,
                                fecha_cierre = NOW(),
                                atendido_por = ?
                            WHERE presupuesto_id = ?
                              AND estado = 'Programado'
                            ORDER BY id DESC
                            LIMIT 1
                        `,
                        [
                            motivoCierreSeguimiento,
                            administrador,
                            id
                        ]
                    );

                seguimientoCancelado =
                    resultadoSeguimiento.affectedRows > 0;
            }

            await connection.commit();

            return res.json({
                ok: true,
                mensaje:
                    esEstadoFinal
                        ? (
                            seguimientoCancelado
                                ? `Ticket marcado como ${estado} y seguimiento pendiente cancelado.`
                                : `Ticket marcado como ${estado}.`
                        )
                        : necesitaRegistrarContacto
                            ? "Estado actualizado y contacto manual registrado."
                            : "Estado actualizado correctamente.",
                estado,
                contacto_registrado:
                    necesitaRegistrarContacto,
                seguimiento_cerrado:
                    seguimientoCancelado,
                proximo_seguimiento:
                    esEstadoFinal
                        ? null
                        : ticketActual.proximo_seguimiento
            });

        } catch (error) {

            if (connection) {
                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error(
                        "Error haciendo rollback del cambio de estado:",
                        rollbackError
                    );
                }
            }

            console.error(
                "Error cambiando estado del ticket:",
                error
            );

            return res.status(500).json({
                ok: false,
                mensaje:
                    "No se pudo actualizar el estado. No se realizó ningún cambio."
            });

        } finally {

            if (connection) {
                connection.release();
            }

        }

    }
);

// =====================================================
// HISTORIAL DE UN PRESUPUESTO
// =====================================================

app.get(
    "/presupuestos-admin/:id/historial",
    autenticarAdmin,
    (req, res) => {

        const { id } = req.params;

        const sql = `
            SELECT
                id,
                presupuesto_id,
                estado,
                fecha
            FROM presupuesto_historial
            WHERE presupuesto_id = ?
            ORDER BY id ASC
        `;

        db.query(
            sql,
            [id],
            (err, resultados) => {

                if (err) {

                    console.error(
                        "Error obteniendo historial:",
                        err
                    );

                    return res.status(500).json({

                        ok: false,

                        mensaje:
                            "No se pudo obtener el historial."

                    });

                }

                return res.json({

                    ok: true,

                    historial:
                        resultados

                });

            }
        );

    }
);

// =====================================================
// CLIENTES - ADMIN
// =====================================================


// LISTAR CLIENTES

app.get(
    "/admin/clientes",
    autenticarAdmin,
    (req, res) => {

        const sql = `
            SELECT
                id,
                nombre,
                email,
                telefono,
                fecha_registro,
                verificado
            FROM clientes
            ORDER BY id DESC
        `;


        db.query(
            sql,
            (err, resultados) => {

                if (err) {

                    console.error(
                        "Error obteniendo clientes:",
                        err
                    );

                    return res.status(500).json({

                        ok: false,

                        mensaje:
                            "No se pudieron obtener los clientes."

                    });

                }


                res.json({

                    ok: true,

                    clientes:
                        resultados

                });

            }
        );

    }
);


/// =====================================================
// FICHA COMPLETA DE CLIENTE
// =====================================================

app.get(
    "/admin/clientes/:id",
    autenticarAdmin,
    (req, res) => {

        const { id } =
            req.params;

        const sqlCliente = `
            SELECT
                id,
                nombre,
                email,
                telefono,
                fecha_registro,
                verificado
            FROM clientes
            WHERE id = ?
        `;

        db.query(
            sqlCliente,
            [id],
            (err, clientes) => {

                if (err) {

                    console.error(
                        "Error obteniendo cliente:",
                        err
                    );

                    return res.status(500).json({
                        ok: false,
                        mensaje:
                            "No se pudo obtener el cliente."
                    });

                }

                if (
                    clientes.length === 0
                ) {

                    return res.status(404).json({
                        ok: false,
                        mensaje:
                            "Cliente no encontrado."
                    });

                }

                const sqlPresupuestos = `
                    SELECT
                        id,
                        cliente_id,
                        codigo,
                        cliente,
                        telefono,
                        productos,
                        total,
                        estado,
                        nota_admin,
                        fecha
                    FROM presupuestos
                    WHERE cliente_id = ?
                    ORDER BY id DESC
                `;

                db.query(
                    sqlPresupuestos,
                    [id],
                    (err, presupuestos) => {

                        if (err) {

                            console.error(
                                "Error obteniendo tickets del cliente:",
                                err
                            );

                            return res.status(500).json({
                                ok: false,
                                mensaje:
                                    "No se pudieron obtener los tickets del cliente."
                            });

                        }

                        return res.json({
                            ok: true,
                            cliente:
                                clientes[0],
                            presupuestos:
                                presupuestos || []
                        });

                    }
                );

            }
        );

    }
);

// =====================================================
// DASHBOARD ADMIN
// =====================================================

app.get(
    "/admin/dashboard",
    autenticarAdmin,
    (req, res) => {

        const sql = `
            SELECT

                (
                    SELECT COUNT(*)
                    FROM clientes
                ) AS clientes,

                COUNT(*) AS presupuestos,

                COALESCE(
                    SUM(
                        CASE
                            WHEN estado = 'Pendiente'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS pendientes,

                COALESCE(
                    SUM(
                        CASE
                            WHEN ultimo_contacto IS NULL
                            AND estado NOT IN (
                                'Aprobado',
                                'Rechazado'
                            )
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS sin_contactar,

                COALESCE(
                    SUM(
                        CASE
                            WHEN estado = 'Contactado'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS contactados,

                COALESCE(
                    SUM(
                        CASE
                            WHEN estado = 'En revisión'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS revision,

                COALESCE(
                    SUM(
                        CASE
                            WHEN estado = 'Aprobado'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS aprobados,

                COALESCE(
                    SUM(
                        CASE
                            WHEN estado = 'Rechazado'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS rechazados,

                COALESCE(
                    SUM(
                        CASE
                            WHEN proximo_seguimiento IS NOT NULL
                            AND DATE(proximo_seguimiento) = CURDATE()
                            AND proximo_seguimiento >= NOW()
                            AND estado NOT IN (
                                'Aprobado',
                                'Rechazado'
                            )
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS seguimientos_hoy,

                COALESCE(
                    SUM(
                        CASE
                            WHEN proximo_seguimiento IS NOT NULL
                            AND proximo_seguimiento < NOW()
                            AND estado NOT IN (
                                'Aprobado',
                                'Rechazado'
                            )
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS seguimientos_vencidos,

                COALESCE(
                    SUM(total),
                    0
                ) AS monto

            FROM presupuestos
        `;

        db.query(
            sql,
            (err, resultados) => {

                if (err) {

                    console.error(
                        "Error cargando dashboard:",
                        err
                    );

                    return res.status(500).json({
                        ok: false,
                        mensaje:
                            "No se pudo cargar el dashboard."
                    });

                }

                const datos =
                    resultados[0] || {};

                return res.json({
                    ok: true,

                    dashboard: {

                        clientes:
                            Number(
                                datos.clientes || 0
                            ),

                        presupuestos:
                            Number(
                                datos.presupuestos || 0
                            ),

                        pendientes:
                            Number(
                                datos.pendientes || 0
                            ),

                        sin_contactar:
                            Number(
                                datos.sin_contactar || 0
                            ),

                        contactados:
                            Number(
                                datos.contactados || 0
                            ),

                        revision:
                            Number(
                                datos.revision || 0
                            ),

                        aprobados:
                            Number(
                                datos.aprobados || 0
                            ),

                        rechazados:
                            Number(
                                datos.rechazados || 0
                            ),

                        seguimientos_hoy:
                            Number(
                                datos.seguimientos_hoy || 0
                            ),

                        seguimientos_vencidos:
                            Number(
                                datos.seguimientos_vencidos || 0
                            ),

                        monto:
                            Number(
                                datos.monto || 0
                            )

                    }

                });

            }
        );

    }
);

// =====================================================
// ÚLTIMOS PRESUPUESTOS
// =====================================================

app.get(
    "/admin/dashboard/ultimos-presupuestos",
    autenticarAdmin,
    (req, res) => {

        const sql = `
            SELECT
                id,
                codigo,
                cliente,
                telefono,
                total,
                estado,
                fecha
            FROM presupuestos
            ORDER BY id DESC
            LIMIT 8
        `;


        db.query(
            sql,
            (err, resultados) => {

                if (err) {

                    console.error(
                        "Error obteniendo últimos presupuestos:",
                        err
                    );

                    return res.status(500).json({

                        ok: false,

                        mensaje:
                            "No se pudieron obtener los presupuestos."

                    });

                }


                res.json({

                    ok: true,

                    presupuestos:
                        resultados

                });

            }
        );

    }
);

// =====================================================
// GUARDAR / ACTUALIZAR NOTA INTERNA DEL TICKET
// =====================================================

app.put(
    "/presupuestos/:id/nota",
    autenticarAdmin,
    (req, res) => {

        const { id } = req.params;
        const { nota_admin } = req.body;

        const sql = `
            UPDATE presupuestos
            SET nota_admin = ?
            WHERE id = ?
        `;

        db.query(
            sql,
            [
                nota_admin || null,
                id
            ],
            (err, resultado) => {

                if (err) {

                    console.error(
                        "Error guardando nota interna:",
                        err
                    );

                    return res.status(500).json({
                        ok: false,
                        mensaje:
                            "No se pudo guardar la nota interna."
                    });

                }

                if (resultado.affectedRows === 0) {

                    return res.status(404).json({
                        ok: false,
                        mensaje:
                            "Presupuesto no encontrado."
                    });

                }

                return res.json({
                    ok: true,
                    mensaje:
                        "Nota interna guardada correctamente.",
                    nota_admin:
                        nota_admin || ""
                });

            }
        );

    }
);

// =====================================================
// REGISTRAR CONTACTO DEL TICKET
// TRANSACCIÓN: TICKET + CONTACTO + HISTORIAL + SEGUIMIENTO
// =====================================================

app.put(
    "/presupuestos/:id/contacto",
    autenticarAdmin,
    async (req, res) => {

        const { id } = req.params;

        const {
            atendido_por,
            medio,
            cerrar_seguimiento
        } = req.body;

        const medioFinal =
            medio || "Manual";

        const mediosPermitidos = [
            "Manual",
            "WhatsApp",
            "Llamada"
        ];

        if (
            !mediosPermitidos.includes(
                medioFinal
            )
        ) {
            return res.status(400).json({
                ok: false,
                mensaje:
                    "Medio de contacto no válido."
            });
        }

        let connection;

        try {

            connection =
                await db.promise().getConnection();

            await connection.beginTransaction();

            const [tickets] =
                await connection.query(
                    `
                        SELECT
                            id,
                            estado,
                            proximo_seguimiento
                        FROM presupuestos
                        WHERE id = ?
                        LIMIT 1
                        FOR UPDATE
                    `,
                    [id]
                );

            if (
                !tickets ||
                tickets.length === 0
            ) {
                await connection.rollback();

                return res.status(404).json({
                    ok: false,
                    mensaje:
                        "Ticket no encontrado."
                });
            }

            const ticketActual =
                tickets[0];

            const estadoAnterior =
                ticketActual.estado ||
                "Pendiente";

            const debePasarAContactado =
                estadoAnterior ===
                "Pendiente";

            const nuevoEstado =
                debePasarAContactado
                    ? "Contactado"
                    : estadoAnterior;

            const administrador =
                nombreAdminAutenticado(req);

            const debeCerrarSeguimiento =
                cerrar_seguimiento === true &&
                Boolean(
                    ticketActual.proximo_seguimiento
                );

            if (debeCerrarSeguimiento) {

                await connection.query(
                    `
                        UPDATE presupuestos
                        SET
                            atendido_por = ?,
                            ultimo_contacto = NOW(),
                            estado = ?,
                            proximo_seguimiento = NULL
                        WHERE id = ?
                    `,
                    [
                        administrador,
                        nuevoEstado,
                        id
                    ]
                );

            } else {

                await connection.query(
                    `
                        UPDATE presupuestos
                        SET
                            atendido_por = ?,
                            ultimo_contacto = NOW(),
                            estado = ?
                        WHERE id = ?
                    `,
                    [
                        administrador,
                        nuevoEstado,
                        id
                    ]
                );

            }

            await connection.query(
                `
                    INSERT INTO presupuesto_contactos
                    (
                        presupuesto_id,
                        atendido_por,
                        medio
                    )
                    VALUES (?, ?, ?)
                `,
                [
                    id,
                    administrador,
                    medioFinal
                ]
            );

            if (debePasarAContactado) {

                await connection.query(
                    `
                        INSERT INTO presupuesto_historial
                        (
                            presupuesto_id,
                            estado
                        )
                        VALUES (?, ?)
                    `,
                    [
                        id,
                        "Contactado"
                    ]
                );

            }

            if (debeCerrarSeguimiento) {

                await connection.query(
                    `
                        UPDATE presupuesto_seguimientos
                        SET
                            estado = 'Completado',
                            motivo_cierre = 'Contacto realizado',
                            fecha_cierre = NOW(),
                            atendido_por = ?
                        WHERE presupuesto_id = ?
                          AND estado = 'Programado'
                        ORDER BY id DESC
                        LIMIT 1
                    `,
                    [
                        administrador,
                        id
                    ]
                );

            }

            const [resultados] =
                await connection.query(
                    `
                        SELECT
                            id,
                            estado,
                            atendido_por,
                            ultimo_contacto,
                            proximo_seguimiento
                        FROM presupuestos
                        WHERE id = ?
                        LIMIT 1
                    `,
                    [id]
                );

            const ticket =
                resultados[0];

            await connection.commit();

            return res.json({
                ok: true,
                mensaje:
                    debeCerrarSeguimiento
                        ? "Contacto registrado y seguimiento completado."
                        : debePasarAContactado
                            ? "Contacto registrado y ticket marcado como Contactado."
                            : "Contacto registrado correctamente.",
                atendido_por:
                    ticket.atendido_por,
                ultimo_contacto:
                    ticket.ultimo_contacto,
                estado:
                    ticket.estado,
                proximo_seguimiento:
                    ticket.proximo_seguimiento,
                cambio_estado:
                    debePasarAContactado,
                seguimiento_cerrado:
                    debeCerrarSeguimiento,
                medio:
                    medioFinal
            });

        } catch (error) {

            if (connection) {
                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error(
                        "Error haciendo rollback del contacto:",
                        rollbackError
                    );
                }
            }

            console.error(
                "Error registrando contacto:",
                error
            );

            return res.status(500).json({
                ok: false,
                mensaje:
                    "No se pudo registrar el contacto. No se realizó ningún cambio."
            });

        } finally {

            if (connection) {
                connection.release();
            }

        }

    }
);

// =====================================================
// HISTORIAL DE CONTACTOS DEL TICKET
// =====================================================

app.get(
    "/presupuestos-admin/:id/contactos",
    autenticarAdmin,
    (req, res) => {

        const { id } = req.params;

        const sql = `
            SELECT
                id,
                presupuesto_id,
                atendido_por,
                medio,
                fecha
            FROM presupuesto_contactos
            WHERE presupuesto_id = ?
            ORDER BY id DESC
        `;

        db.query(
            sql,
            [id],
            (
                err,
                contactos
            ) => {

                if (err) {

                    console.error(
                        "Error obteniendo historial de contactos:",
                        err
                    );

                    return res.status(500).json({
                        ok: false,
                        mensaje:
                            "No se pudo obtener el historial de contactos."
                    });

                }

                return res.json({
                    ok: true,
                    contactos:
                        contactos || []
                });

            }
        );

    }
);


// =====================================================
// GUARDAR / REPROGRAMAR / CANCELAR SEGUIMIENTO
// TRANSACCIÓN: TICKET + HISTORIAL DE SEGUIMIENTO
// =====================================================

app.put(
    "/presupuestos/:id/seguimiento",
    autenticarAdmin,
    async (req, res) => {

        const { id } = req.params;

        const {
            proximo_seguimiento,
            atendido_por
        } = req.body;

        const administrador =
                nombreAdminAutenticado(req);

        let connection;

        try {

            connection =
                await db.promise().getConnection();

            await connection.beginTransaction();

            const [tickets] =
                await connection.query(
                    `
                        SELECT
                            id,
                            estado,
                            proximo_seguimiento
                        FROM presupuestos
                        WHERE id = ?
                        LIMIT 1
                        FOR UPDATE
                    `,
                    [id]
                );

            if (
                !tickets ||
                tickets.length === 0
            ) {
                await connection.rollback();

                return res.status(404).json({
                    ok: false,
                    mensaje:
                        "Ticket no encontrado."
                });
            }

            const ticket =
                tickets[0];

            const estadoActual =
                ticket.estado ||
                "Pendiente";

            const ticketFinalizado =
                estadoActual === "Aprobado" ||
                estadoActual === "Rechazado";

            if (
                ticketFinalizado &&
                proximo_seguimiento
            ) {
                await connection.rollback();

                return res.status(400).json({
                    ok: false,
                    mensaje:
                        `No se puede programar un seguimiento porque el ticket está ${estadoActual}.`
                });
            }

            const seguimientoAnterior =
                ticket.proximo_seguimiento;

            // ------------------------------------------
            // CANCELAR SEGUIMIENTO
            // ------------------------------------------

            if (!proximo_seguimiento) {

                if (!seguimientoAnterior) {
                    await connection.commit();

                    return res.json({
                        ok: true,
                        mensaje:
                            "No había un seguimiento programado.",
                        proximo_seguimiento:
                            null
                    });
                }

                await connection.query(
                    `
                        UPDATE presupuestos
                        SET proximo_seguimiento = NULL
                        WHERE id = ?
                    `,
                    [id]
                );

                await connection.query(
                    `
                        UPDATE presupuesto_seguimientos
                        SET
                            estado = 'Cancelado',
                            motivo_cierre = 'Cancelado manualmente',
                            fecha_cierre = NOW(),
                            atendido_por = ?
                        WHERE presupuesto_id = ?
                          AND estado = 'Programado'
                        ORDER BY id DESC
                        LIMIT 1
                    `,
                    [
                        administrador,
                        id
                    ]
                );

                await connection.commit();

                return res.json({
                    ok: true,
                    mensaje:
                        "Seguimiento cancelado correctamente.",
                    proximo_seguimiento:
                        null
                });
            }

            // ------------------------------------------
            // VALIDAR NUEVA FECHA
            // ------------------------------------------

            const fecha =
                new Date(
                    proximo_seguimiento
                );

            if (
                Number.isNaN(
                    fecha.getTime()
                )
            ) {
                await connection.rollback();

                return res.status(400).json({
                    ok: false,
                    mensaje:
                        "La fecha de seguimiento no es válida."
                });
            }

            if (
                fecha.getTime() <=
                Date.now()
            ) {
                await connection.rollback();

                return res.status(400).json({
                    ok: false,
                    mensaje:
                        "El seguimiento debe programarse para una fecha y hora futura."
                });
            }

            function dosDigitos(numero) {
                return String(numero).padStart(
                    2,
                    "0"
                );
            }

            const fechaMysql =
                `${fecha.getFullYear()}-` +
                `${dosDigitos(fecha.getMonth() + 1)}-` +
                `${dosDigitos(fecha.getDate())} ` +
                `${dosDigitos(fecha.getHours())}:` +
                `${dosDigitos(fecha.getMinutes())}:00`;

            // Si ya había seguimiento, cerrarlo primero.
            if (seguimientoAnterior) {

                await connection.query(
                    `
                        UPDATE presupuesto_seguimientos
                        SET
                            estado = 'Cancelado',
                            motivo_cierre = 'Reprogramado',
                            fecha_cierre = NOW(),
                            atendido_por = ?
                        WHERE presupuesto_id = ?
                          AND estado = 'Programado'
                        ORDER BY id DESC
                        LIMIT 1
                    `,
                    [
                        administrador,
                        id
                    ]
                );

            }

            await connection.query(
                `
                    UPDATE presupuestos
                    SET proximo_seguimiento = ?
                    WHERE id = ?
                `,
                [
                    fechaMysql,
                    id
                ]
            );

            await connection.query(
                `
                    INSERT INTO presupuesto_seguimientos
                    (
                        presupuesto_id,
                        fecha_programada,
                        estado,
                        motivo_cierre,
                        atendido_por
                    )
                    VALUES (
                        ?,
                        ?,
                        'Programado',
                        NULL,
                        ?
                    )
                `,
                [
                    id,
                    fechaMysql,
                    administrador
                ]
            );

            const [resultados] =
                await connection.query(
                    `
                        SELECT
                            proximo_seguimiento
                        FROM presupuestos
                        WHERE id = ?
                        LIMIT 1
                    `,
                    [id]
                );

            await connection.commit();

            return res.json({
                ok: true,
                mensaje:
                    seguimientoAnterior
                        ? "Seguimiento reprogramado correctamente."
                        : "Seguimiento programado correctamente.",
                proximo_seguimiento:
                    resultados[0]
                        ?.proximo_seguimiento ||
                    null
            });

        } catch (error) {

            if (connection) {
                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error(
                        "Error haciendo rollback del seguimiento:",
                        rollbackError
                    );
                }
            }

            console.error(
                "Error guardando seguimiento:",
                error
            );

            return res.status(500).json({
                ok: false,
                mensaje:
                    "No se pudo actualizar el seguimiento. No se realizó ningún cambio."
            });

        } finally {

            if (connection) {
                connection.release();
            }

        }

    }
);

// =====================================================
// HISTORIAL DE SEGUIMIENTOS DEL TICKET
// =====================================================

app.get(
    "/presupuestos-admin/:id/seguimientos",
    autenticarAdmin,
    (req, res) => {

        const { id } = req.params;

        const sql = `
            SELECT
                id,
                presupuesto_id,
                fecha_programada,
                estado,
                motivo_cierre,
                atendido_por,
                fecha_creacion,
                fecha_cierre
            FROM presupuesto_seguimientos
            WHERE presupuesto_id = ?
            ORDER BY id DESC
        `;

        db.query(
            sql,
            [id],
            (
                err,
                seguimientos
            ) => {

                if (err) {

                    console.error(
                        "Error obteniendo historial de seguimientos:",
                        err
                    );

                    return res.status(500).json({
                        ok: false,
                        mensaje:
                            "No se pudo obtener el historial de seguimientos."
                    });

                }

                return res.json({
                    ok: true,
                    seguimientos:
                        seguimientos || []
                });

            }
        );

    }
);

// =====================================================
// PRÓXIMOS SEGUIMIENTOS PARA DASHBOARD
// =====================================================

app.get(
    "/admin/dashboard/seguimientos",
    autenticarAdmin,
    (req, res) => {

        const sql = `
            SELECT
                id,
                codigo,
                cliente_id,
                cliente,
                telefono,
                estado,
                atendido_por,
                ultimo_contacto,
                proximo_seguimiento
            FROM presupuestos
            WHERE proximo_seguimiento IS NOT NULL
              AND estado NOT IN (
                  'Aprobado',
                  'Rechazado'
              )
            ORDER BY
                CASE
                    WHEN proximo_seguimiento < NOW()
                    THEN 0
                    ELSE 1
                END ASC,

                proximo_seguimiento ASC
            LIMIT 8
        `;


        db.query(
            sql,
            (
                err,
                seguimientos
            ) => {

                if (err) {

                    console.error(
                        "Error cargando próximos seguimientos:",
                        err
                    );

                    return res.status(500).json({
                        ok: false,
                        mensaje:
                            "No se pudieron obtener los próximos seguimientos."
                    });

                }


                return res.json({
                    ok: true,

                    seguimientos:
                        seguimientos || []
                });

            }
        );

    }
);

// =====================================================
// INICIAR SERVIDOR
// =====================================================

// =====================================================
// MANEJO GENERAL DE ERRORES
// =====================================================

app.use(
    (err, req, res, next) => {

        console.error(
            "❌ Error no controlado:",
            err
        );

        if (
            res.headersSent
        ) {
            return next(err);
        }

        return res.status(500).json({
            ok: false,
            mensaje:
                "Ocurrió un error interno del servidor."
        });
    }
);


app.listen(
    process.env.PORT || 5000,
    () => {

        console.log(
            `🚀 Servidor iniciado en puerto ${
                process.env.PORT || 5000
            }`
        );

    }
);