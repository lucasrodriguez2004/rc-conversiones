const express = require("express");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

const db = require("../config/db");

const JWT_SECRET =
    process.env.JWT_SECRET;

const CLIENT_JWT_EXPIRES_IN =
    process.env.CLIENT_JWT_EXPIRES_IN ||
    "7d";

const FRONTEND_URL =
    String(
        process.env.FRONTEND_URL ||
        "http://localhost:5173"
    )
        .trim()
        .replace(/\/+$/, "");


function emailEsValido(email) {

    return (
        email.length <= 190 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email
        )
    );

}


function passwordEsValidaParaRegistro(
    password
) {

    return (
        password.length >= 8 &&
        password.length <= 128
    );

}


// ==========================================
// CONFIGURACIÓN DEL CORREO
// ==========================================

const transporter =
    nodemailer.createTransport({
        service: "gmail",

        auth: {
            user:
                process.env.EMAIL_USER,

            pass:
                process.env.EMAIL_PASSWORD
        }
    });


// ==========================================
// UTILIDADES DE AUTENTICACIÓN
// ==========================================

function crearTokenCliente(cliente) {

    if (!JWT_SECRET) {
        throw new Error(
            "JWT_SECRET no está configurado."
        );
    }

    return jwt.sign(
        {
            id:
                cliente.id,

            email:
                cliente.email,

            nombre:
                cliente.nombre,

            tipo:
                "cliente"
        },

        JWT_SECRET,

        {
            expiresIn:
                CLIENT_JWT_EXPIRES_IN
        }
    );

}


function autenticarCliente(
    req,
    res,
    next
) {

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


// ==========================================
// REGISTRO
// POST /clientes/registro
// ==========================================

router.post(
    "/registro",
    async (req, res) => {

        const nombre =
            String(
                req.body?.nombre || ""
            ).trim();

        const email =
            String(
                req.body?.email || ""
            )
                .trim()
                .toLowerCase();

        const telefono =
            String(
                req.body?.telefono || ""
            ).trim();

        const password =
            String(
                req.body?.password || ""
            );


        if (
            !nombre ||
            !email ||
            !telefono ||
            !password
        ) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "Completá todos los campos."
            });

        }


        if (
            nombre.length > 120
        ) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "El nombre es demasiado largo."
            });

        }


        if (
            !emailEsValido(
                email
            )
        ) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "Ingresá un correo electrónico válido."
            });

        }


        if (
            telefono.length > 30
        ) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "El teléfono es demasiado largo."
            });

        }


        if (
            !passwordEsValidaParaRegistro(
                password
            )
        ) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "La contraseña debe tener entre 8 y 128 caracteres."
            });

        }


        let clienteCreadoId = null;


        try {

            const [existentes] =
                await db.promise().query(
                    `
                        SELECT id
                        FROM clientes
                        WHERE email = ?
                        LIMIT 1
                    `,
                    [email]
                );


            if (
                existentes &&
                existentes.length > 0
            ) {

                return res.status(400).json({
                    ok: false,
                    mensaje:
                        "Ya existe una cuenta con ese correo."
                });

            }


            const passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );


            const codigoVerificacion =
                crypto
                    .randomBytes(32)
                    .toString("hex");


            const [resultado] =
                await db.promise().query(
                    `
                        INSERT INTO clientes
                        (
                            nombre,
                            email,
                            telefono,
                            password,
                            verificado,
                            codigo_verificacion
                        )
                        VALUES (?, ?, ?, ?, ?, ?)
                    `,
                    [
                        nombre,
                        email,
                        telefono,
                        passwordHash,
                        0,
                        codigoVerificacion
                    ]
                );


            clienteCreadoId =
                resultado.insertId;


            const enlace =
                `${FRONTEND_URL}/verificar/${codigoVerificacion}`;


            try {

                await transporter.sendMail({

                    from:
                        `"RC Conversiones" <${process.env.EMAIL_USER}>`,

                    to:
                        email,

                    subject:
                        "Verificá tu cuenta - RC Conversiones",

                    html: `
                        <div style="
                            font-family: Arial, sans-serif;
                            max-width: 600px;
                            margin: auto;
                            padding: 30px;
                            border: 1px solid #ddd;
                            border-radius: 12px;
                            background: #ffffff;
                        ">

                            <h1 style="
                                color: #0d8cff;
                            ">
                                RC Conversiones
                            </h1>

                            <h2>
                                ¡Hola ${nombre}!
                            </h2>

                            <p>
                                Gracias por registrarte
                                en RC Conversiones.
                            </p>

                            <p>
                                Para activar tu cuenta,
                                hacé clic en el siguiente botón:
                            </p>

                            <div style="
                                margin: 30px 0;
                                text-align: center;
                            ">

                                <a
                                    href="${enlace}"
                                    style="
                                        display: inline-block;
                                        padding: 15px 25px;
                                        background: #0d8cff;
                                        color: white;
                                        text-decoration: none;
                                        border-radius: 8px;
                                        font-weight: bold;
                                    "
                                >
                                    Verificar mi cuenta
                                </a>

                            </div>

                            <p>
                                Si vos no creaste esta cuenta,
                                simplemente ignorá este correo.
                            </p>

                            <p>
                                RC Conversiones
                            </p>

                        </div>
                    `
                });


                return res.json({
                    ok: true,
                    mensaje:
                        "Cuenta creada. Revisá tu correo para verificarla."
                });


            } catch (errorCorreo) {

                console.error(
                    "Error enviando correo:",
                    errorCorreo
                );


                await db.promise().query(
                    `
                        DELETE FROM clientes
                        WHERE id = ?
                    `,
                    [clienteCreadoId]
                );


                return res.status(500).json({
                    ok: false,
                    mensaje:
                        "La cuenta no pudo ser creada porque no se pudo enviar el correo de verificación."
                });

            }


        } catch (error) {

            console.error(
                "Error creando cliente:",
                error
            );


            if (
                clienteCreadoId
            ) {

                try {

                    await db.promise().query(
                        `
                            DELETE FROM clientes
                            WHERE id = ?
                        `,
                        [clienteCreadoId]
                    );

                } catch (errorLimpieza) {

                    console.error(
                        "Error limpiando cliente incompleto:",
                        errorLimpieza
                    );

                }

            }


            if (
                error?.code ===
                "ER_DUP_ENTRY"
            ) {

                return res.status(400).json({
                    ok: false,
                    mensaje:
                        "Ya existe una cuenta con ese correo."
                });

            }


            return res.status(500).json({
                ok: false,
                mensaje:
                    "No se pudo crear la cuenta."
            });

        }

    }
);




// ============================================================
// RC_CAMBIO_EMAIL_VERIFICACION_V1
// Antes del verificador normal, intenta confirmar un cambio de email.
// Si el código no corresponde a un cambio de email, continúa al
// verificador de registro que ya existía.
// ============================================================

router.get(
  "/verificar/:codigo",
  async (req, res, next) => {
    const codigo = String(req.params?.codigo || "").trim();

    if (!codigo) {
      return next();
    }

    try {
      const [rows] = await db.promise().query(
        `
          SELECT
            id,
            nombre,
            email,
            email_pendiente
          FROM clientes
          WHERE codigo_cambio_email = ?
            AND email_pendiente IS NOT NULL
          LIMIT 1
        `,
        [codigo]
      );

      if (!rows.length) {
        return next();
      }

      const cliente = rows[0];

      const [duplicados] = await db.promise().query(
        `
          SELECT id
          FROM clientes
          WHERE id <> ?
            AND LOWER(email) = LOWER(?)
          LIMIT 1
        `,
        [cliente.id, cliente.email_pendiente]
      );

      if (duplicados.length) {
        return res.status(400).json({
          ok: false,
          mensaje:
            "Ese correo ya está asociado a otra cuenta. No se pudo completar el cambio."
        });
      }

      await db.promise().query(
        `
          UPDATE clientes
          SET
            email = email_pendiente,
            email_pendiente = NULL,
            codigo_cambio_email = NULL,
            fecha_cambio_email = NULL
          WHERE id = ?
        `,
        [cliente.id]
      );

      return res.json({
        ok: true,
        mensaje:
          "¡Tu nuevo correo fue verificado correctamente! Ya podés usarlo para iniciar sesión."
      });
    } catch (error) {
      console.error("Error verificando cambio de email:", error);

      return res.status(500).json({
        ok: false,
        mensaje: "No se pudo verificar el nuevo correo."
      });
    }
  }
);


// ==========================================
// VERIFICAR CUENTA
// GET /clientes/verificar/:codigo
// ==========================================

router.get(
    "/verificar/:codigo",
    async (req, res) => {

        const codigo =
            String(
                req.params?.codigo || ""
            ).trim();


        if (!codigo) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "El enlace de verificación no es válido."
            });

        }


        try {

            const [resultados] =
                await db.promise().query(
                    `
                        SELECT
                            id,
                            nombre,
                            email,
                            verificado
                        FROM clientes
                        WHERE codigo_verificacion = ?
                        LIMIT 1
                    `,
                    [codigo]
                );


            if (
                !resultados ||
                resultados.length === 0
            ) {

                return res.status(400).json({
                    ok: false,
                    mensaje:
                        "El enlace de verificación no es válido o ya fue utilizado."
                });

            }


            const cliente =
                resultados[0];


            if (
                Number(
                    cliente.verificado
                ) === 1
            ) {

                return res.json({
                    ok: true,
                    mensaje:
                        "Tu cuenta ya estaba verificada."
                });

            }


            await db.promise().query(
                `
                    UPDATE clientes
                    SET
                        verificado = 1,
                        codigo_verificacion = NULL
                    WHERE id = ?
                `,
                [cliente.id]
            );


            return res.json({
                ok: true,
                mensaje:
                    "¡Cuenta verificada correctamente!"
            });


        } catch (error) {

            console.error(
                "Error verificando cuenta:",
                error
            );


            return res.status(500).json({
                ok: false,
                mensaje:
                    "No se pudo activar la cuenta."
            });

        }

    }
);


// ==========================================
// LOGIN
// POST /clientes/login
// ==========================================

router.post(
    "/login",
    async (req, res) => {

        const email =
            String(
                req.body?.email || ""
            )
                .trim()
                .toLowerCase();

        const password =
            String(
                req.body?.password || ""
            );


        if (
            !email ||
            !password
        ) {

            return res.status(400).json({
                ok: false,
                mensaje:
                    "Completá el email y la contraseña."
            });

        }


        if (
            !emailEsValido(
                email
            ) ||
            password.length > 128
        ) {

            return res.status(401).json({
                ok: false,
                mensaje:
                    "El email o la contraseña son incorrectos."
            });

        }


        try {

            const [resultados] =
                await db.promise().query(
                    `
                        SELECT
                            id,
                            nombre,
                            email,
                            telefono,
                            password,
                            verificado,
                            fecha_registro
                        FROM clientes
                        WHERE email = ?
                        LIMIT 1
                    `,
                    [email]
                );


            if (
                !resultados ||
                resultados.length === 0
            ) {

                return res.status(401).json({
                    ok: false,
                    mensaje:
                        "El email o la contraseña son incorrectos."
                });

            }


            const cliente =
                resultados[0];


            const passwordGuardada =
                String(
                    cliente.password || ""
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

                // Compatibilidad temporal con clientes
                // creados antes de bcrypt.
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
                            UPDATE clientes
                            SET password = ?
                            WHERE id = ?
                        `,
                        [
                            nuevoHash,
                            cliente.id
                        ]
                    );


                    console.log(
                        `🔐 Contraseña del cliente ${cliente.id} migrada a bcrypt.`
                    );

                }

            }


            if (!passwordValida) {

                return res.status(401).json({
                    ok: false,
                    mensaje:
                        "El email o la contraseña son incorrectos."
                });

            }


            if (
                Number(
                    cliente.verificado
                ) !== 1
            ) {

                return res.status(403).json({
                    ok: false,

                    verificacionPendiente:
                        true,

                    mensaje:
                        "Tu cuenta todavía no fue verificada. Revisá tu correo electrónico."
                });

            }


            const clienteRespuesta = {

                id:
                    cliente.id,

                nombre:
                    cliente.nombre,

                email:
                    cliente.email,

                telefono:
                    cliente.telefono,

                verificado:
                    cliente.verificado,

                fecha_registro:
                    cliente.fecha_registro

            };


            const token =
                crearTokenCliente(
                    clienteRespuesta
                );


            return res.json({

                ok: true,

                mensaje:
                    "Inicio de sesión correcto.",

                cliente:
                    clienteRespuesta,

                token

            });


        } catch (error) {

            console.error(
                "Error en login cliente:",
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


// ==========================================
// DATOS DE LA CUENTA AUTENTICADA
// GET /clientes/me
// ==========================================

router.get(
    "/me",
    autenticarCliente,
    async (req, res) => {

        try {

            const [resultados] =
                await db.promise().query(
                    `
                        SELECT
                            id,
                            nombre,
                            email,
                            telefono,
                            verificado,
                            fecha_registro
                        FROM clientes
                        WHERE id = ?
                        LIMIT 1
                    `,
                    [req.cliente.id]
                );


            if (
                !resultados ||
                resultados.length === 0
            ) {

                return res.status(404).json({
                    ok: false,
                    mensaje:
                        "La cuenta ya no existe."
                });

            }


            const cliente =
                resultados[0];


            if (
                Number(
                    cliente.verificado
                ) !== 1
            ) {

                return res.status(403).json({
                    ok: false,
                    mensaje:
                        "La cuenta no está verificada."
                });

            }


            return res.json({
                ok: true,
                cliente
            });


        } catch (error) {

            console.error(
                "Error obteniendo cuenta del cliente:",
                error
            );


            return res.status(500).json({
                ok: false,
                mensaje:
                    "No se pudo obtener la cuenta."
            });

        }

    }
);




// ============================================================
// RC_PERFIL_EDITABLE_V1
// Perfil del cliente autenticado
// ============================================================

router.get(
  "/perfil",
  autenticarCliente,
  async (req, res) => {
    try {
      const [rows] = await db.promise().query(
        `
          SELECT
            id,
            nombre,
            email,
            telefono,
            verificado,
            fecha_registro,
            email_pendiente
          FROM clientes
          WHERE id = ?
          LIMIT 1
        `,
        [req.cliente.id]
      );

      if (!rows.length) {
        return res.status(404).json({
          ok: false,
          mensaje: "La cuenta ya no existe."
        });
      }

      return res.json({
        ok: true,
        cliente: rows[0]
      });
    } catch (error) {
      console.error("Error obteniendo perfil:", error);

      return res.status(500).json({
        ok: false,
        mensaje: "No se pudo obtener tu perfil."
      });
    }
  }
);

router.put(
  "/perfil",
  autenticarCliente,
  async (req, res) => {
    const nombre = String(req.body?.nombre || "").trim();
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const telefono = String(req.body?.telefono || "").trim();

    if (nombre.length < 2 || nombre.length > 100) {
      return res.status(400).json({
        ok: false,
        mensaje: "Ingresá un nombre válido."
      });
    }

    if (
      !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) ||
      email.length > 180
    ) {
      return res.status(400).json({
        ok: false,
        mensaje: "Ingresá un correo electrónico válido."
      });
    }

    if (telefono.length < 6 || telefono.length > 40) {
      return res.status(400).json({
        ok: false,
        mensaje: "Ingresá un teléfono válido."
      });
    }

    try {
      const [rows] = await db.promise().query(
        `
          SELECT
            id,
            nombre,
            email,
            telefono,
            verificado,
            fecha_registro,
            email_pendiente
          FROM clientes
          WHERE id = ?
          LIMIT 1
        `,
        [req.cliente.id]
      );

      if (!rows.length) {
        return res.status(404).json({
          ok: false,
          mensaje: "La cuenta ya no existe."
        });
      }

      const actual = rows[0];
      const cambiaEmail = email !== String(actual.email || "").toLowerCase();

      if (cambiaEmail) {
        const [duplicados] = await db.promise().query(
          `
            SELECT id
            FROM clientes
            WHERE id <> ?
              AND (
                LOWER(email) = ?
                OR LOWER(COALESCE(email_pendiente, '')) = ?
              )
            LIMIT 1
          `,
          [actual.id, email, email]
        );

        if (duplicados.length) {
          return res.status(400).json({
            ok: false,
            mensaje: "Ese correo ya está siendo utilizado por otra cuenta."
          });
        }
      }

      await db.promise().query(
        `
          UPDATE clientes
          SET nombre = ?, telefono = ?
          WHERE id = ?
        `,
        [nombre, telefono, actual.id]
      );

      let mensaje = "Tus datos se actualizaron correctamente.";

      if (cambiaEmail) {
        const codigoCambioEmail = crypto
          .randomBytes(32)
          .toString("hex");

        const frontendUrlRaw = String(
          process.env.FRONTEND_URL ||
          process.env.CLIENT_URL ||
          "http://localhost:5173"
        );

        const frontendUrl = frontendUrlRaw.endsWith("/")
          ? frontendUrlRaw.slice(0, -1)
          : frontendUrlRaw;

        const enlace = `${frontendUrl}/verificar/${codigoCambioEmail}`;

        try {
          await transporter.sendMail({
            from: `"RC Conversiones" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Confirmá tu nuevo correo - RC Conversiones",
            html: `
              <div style="
                max-width:600px;
                margin:auto;
                padding:32px;
                font-family:Arial,sans-serif;
                background:#ffffff;
                border:1px solid #dce8f3;
                border-radius:16px;
              ">
                <h1 style="color:#0b3978;margin-top:0;">
                  RC Conversiones
                </h1>

                <h2>Confirmá tu nuevo correo</h2>

                <p>
                  Hola ${nombre}. Recibimos una solicitud para cambiar
                  el correo de tu cuenta a:
                </p>

                <p style="font-weight:bold;">
                  ${email}
                </p>

                <p>
                  El correo actual seguirá funcionando hasta que confirmes
                  el nuevo.
                </p>

                <div style="margin:28px 0;text-align:center;">
                  <a
                    href="${enlace}"
                    style="
                      display:inline-block;
                      padding:14px 22px;
                      border-radius:10px;
                      background:#148de0;
                      color:white;
                      text-decoration:none;
                      font-weight:bold;
                    "
                  >
                    Confirmar nuevo correo
                  </a>
                </div>

                <p style="color:#6c7f91;font-size:13px;">
                  Si no solicitaste este cambio, podés ignorar el mensaje.
                </p>
              </div>
            `
          });

          await db.promise().query(
            `
              UPDATE clientes
              SET
                email_pendiente = ?,
                codigo_cambio_email = ?,
                fecha_cambio_email = NOW()
              WHERE id = ?
            `,
            [email, codigoCambioEmail, actual.id]
          );

          mensaje =
            "Tus datos se guardaron. Te enviamos un correo para confirmar la nueva dirección.";
        } catch (errorCorreo) {
          console.error("Error enviando verificación de nuevo email:", errorCorreo);

          return res.status(500).json({
            ok: false,
            mensaje:
              "Nombre y teléfono se guardaron, pero no pudimos enviar la verificación del nuevo correo. Tu correo actual no fue modificado."
          });
        }
      }

      const [actualizados] = await db.promise().query(
        `
          SELECT
            id,
            nombre,
            email,
            telefono,
            verificado,
            fecha_registro,
            email_pendiente
          FROM clientes
          WHERE id = ?
          LIMIT 1
        `,
        [actual.id]
      );

      const cliente = actualizados[0];

      const token = crearTokenCliente(cliente);

      return res.json({
        ok: true,
        mensaje,
        cliente,
        token
      });
    } catch (error) {
      console.error("Error actualizando perfil:", error);

      return res.status(500).json({
        ok: false,
        mensaje: "No se pudieron guardar los cambios."
      });
    }
  }
);




// ============================================================
// RC_CAMBIO_PASSWORD_REAUTH_V2
// Reautenticación para cambio de contraseña.
// La contraseña actual se comprueba con la misma estrategia que /login.
// ============================================================

router.post(
  "/perfil/password/reauth",
  autenticarCliente,
  async (req, res) => {
    const email = String(
      req.body?.email || ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      req.body?.password || ""
    );

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        mensaje: "Ingresá tu contraseña actual."
      });
    }

    if (
      !emailEsValido(email) ||
      password.length > 128
    ) {
      return res.status(401).json({
        ok: false,
        mensaje: "La contraseña actual no es correcta."
      });
    }

    try {
      // Mismo tipo de búsqueda que usa /clientes/login.
      const [resultados] = await db.promise().query(
        `
          SELECT
            id,
            nombre,
            email,
            password,
            verificado
          FROM clientes
          WHERE email = ?
          LIMIT 1
        `,
        [email]
      );

      if (!resultados || resultados.length === 0) {
        return res.status(401).json({
          ok: false,
          mensaje: "La contraseña actual no es correcta."
        });
      }

      const cliente = resultados[0];

      // El email ingresado debe pertenecer al mismo cliente de la sesión.
      if (Number(cliente.id) !== Number(req.cliente.id)) {
        return res.status(403).json({
          ok: false,
          mensaje: "La sesión no corresponde a esta cuenta."
        });
      }

      const passwordGuardada = String(
        cliente.password || ""
      );

      const esHashBcrypt =
        /^\$2[aby]\$\d{2}\$/.test(
          passwordGuardada
        );

      let passwordValida = false;

      if (esHashBcrypt) {
        passwordValida = await bcrypt.compare(
          password,
          passwordGuardada
        );
      } else {
        // Misma compatibilidad temporal que el login normal.
        passwordValida =
          password === passwordGuardada;

        if (passwordValida) {
          const nuevoHash = await bcrypt.hash(
            password,
            12
          );

          await db.promise().query(
            `
              UPDATE clientes
              SET password = ?
              WHERE id = ?
            `,
            [nuevoHash, cliente.id]
          );
        }
      }

      if (!passwordValida) {
        return res.status(401).json({
          ok: false,
          mensaje: "La contraseña actual no es correcta."
        });
      }

      // Token corto y de un solo propósito.
      const reauthToken = jwt.sign(
        {
          id: cliente.id,
          tipo: "cliente_password_reauth",
          proposito: "cambiar_password"
        },
        JWT_SECRET,
        {
          expiresIn: "5m"
        }
      );

      return res.json({
        ok: true,
        reauthToken
      });
    } catch (error) {
      console.error(
        "Error reautenticando cambio de contraseña:",
        error
      );

      return res.status(500).json({
        ok: false,
        mensaje:
          "No se pudo validar la contraseña actual."
      });
    }
  }
);

router.put(
  "/perfil/password",
  autenticarCliente,
  async (req, res) => {
    const passwordNueva = String(
      req.body?.passwordNueva || ""
    );

    const reauthToken = String(
      req.body?.reauthToken || ""
    );

    if (
      passwordNueva.length < 8 ||
      passwordNueva.length > 128
    ) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "La nueva contraseña debe tener entre 8 y 128 caracteres."
      });
    }

    if (!reauthToken) {
      return res.status(401).json({
        ok: false,
        mensaje:
          "Volvé a ingresar tu contraseña actual."
      });
    }

    try {
      let reauth;

      try {
        reauth = jwt.verify(
          reauthToken,
          JWT_SECRET
        );
      } catch {
        return res.status(401).json({
          ok: false,
          mensaje:
            "La validación de la contraseña venció. Intentá nuevamente."
        });
      }

      if (
        !reauth ||
        reauth.tipo !== "cliente_password_reauth" ||
        reauth.proposito !== "cambiar_password" ||
        Number(reauth.id) !== Number(req.cliente.id)
      ) {
        return res.status(403).json({
          ok: false,
          mensaje:
            "No se pudo autorizar el cambio de contraseña."
        });
      }

      const nuevoHash = await bcrypt.hash(
        passwordNueva,
        12
      );

      await db.promise().query(
        `
          UPDATE clientes
          SET password = ?
          WHERE id = ?
        `,
        [nuevoHash, req.cliente.id]
      );

      return res.json({
        ok: true,
        mensaje:
          "Tu contraseña fue actualizada correctamente."
      });
    } catch (error) {
      console.error(
        "Error cambiando contraseña del cliente:",
        error
      );

      return res.status(500).json({
        ok: false,
        mensaje:
          "No se pudo cambiar la contraseña. Intentá nuevamente."
      });
    }
  }
);

module.exports = router;
