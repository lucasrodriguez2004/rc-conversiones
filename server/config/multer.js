const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, "uploads/");

    },

    filename: (req, file, cb) => {

        const nombre = Date.now() + path.extname(file.originalname);

        cb(null, nombre);

    }

});

module.exports = multer({ storage });