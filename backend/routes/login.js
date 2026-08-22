const express = require("express");

const router = express.Router();

const db = require("../config/db");

router.post("/", (req, res) => {

    const { usuario, password } = req.body;

    const sql = `
        SELECT *
        FROM administradores
        WHERE usuario = ?
        AND password = ?
    `;

    db.query(
        sql,
        [usuario, password],
        (err, results) => {

            if (err) {
                return res.status(500).json(err);
            }

            if (results.length === 0) {
                return res.json({
                    ok: false
                });
            }

            res.json({
                ok: true,
                administrador: results[0]
            });

        }
    );

});

module.exports = router;