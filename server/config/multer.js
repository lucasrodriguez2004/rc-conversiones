const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadsDir =
    path.join(
        __dirname,
        "..",
        "uploads"
    );

fs.mkdirSync(
    uploadsDir,
    { recursive: true }
);

const storage =
    multer.diskStorage({
        destination: (
            req,
            file,
            cb
        ) => {
            cb(
                null,
                uploadsDir
            );
        },

        filename: (
            req,
            file,
            cb
        ) => {
            const extension =
                path
                    .extname(
                        file.originalname ||
                        ""
                    )
                    .toLowerCase();

            const safeExtension =
                [
                    ".jpg",
                    ".jpeg",
                    ".png",
                    ".webp"
                ].includes(
                    extension
                )
                    ? extension
                    : ".jpg";

            const nombre =
                `${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2, 10)}${safeExtension}`;

            cb(
                null,
                nombre
            );
        }
    });

function fileFilter(
    req,
    file,
    cb
) {
    const permitidos =
        new Set([
            "image/jpeg",
            "image/png",
            "image/webp"
        ]);

    if (
        !permitidos.has(
            String(
                file.mimetype ||
                ""
            ).toLowerCase()
        )
    ) {
        const error =
            new Error(
                "Solo se permiten imágenes JPG, PNG o WebP."
            );

        error.code =
            "TIPO_IMAGEN_INVALIDO";

        cb(
            error,
            false
        );

        return;
    }

    cb(
        null,
        true
    );
}

module.exports =
    multer({
        storage,
        fileFilter,
        limits: {
            // Compatible con el límite del plan gratuito
            // de Cloudinary para imágenes.
            fileSize:
                10 *
                1024 *
                1024
        }
    });
