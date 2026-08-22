const mysql = require("mysql2");
require("dotenv").config();

// =====================================================
// POOL DE CONEXIONES MYSQL
// =====================================================
//
// Mantiene compatibilidad con db.query(...) en todo el proyecto
// y además permite usar transacciones con db.promise().getConnection().

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    charset: "utf8mb4"
});


// =====================================================
// COMPROBAR CONEXIÓN AL INICIAR
// =====================================================

pool.getConnection((err, connection) => {

    if (err) {
        console.error(
            "❌ Error conectando a MySQL:",
            err
        );
        return;
    }

    console.log("✅ Conectado a MySQL");

    connection.release();
});


module.exports = pool;
