const express = require("express");

const router = express.Router();

const db = require("../config/db");


// ==========================================
// OBTENER VENDEDORES ACTIVOS
// GET /vendedores
// ==========================================

router.get("/", (req, res) => {

    const sql = `
        SELECT
            id,
            nombre,
            telefono,
            email
        FROM vendedores
        WHERE activo = 1
        ORDER BY nombre ASC
    `;


    db.query(
        sql,
        (err, resultados) => {

            if (err) {

                console.error(
                    "Error obteniendo vendedores:",
                    err
                );

                return res.status(500).json({

                    ok: false,

                    mensaje:
                        "No se pudieron obtener los vendedores."

                });

            }


            return res.json({

                ok: true,

                vendedores:
                    resultados

            });

        }
    );

});


module.exports = router;