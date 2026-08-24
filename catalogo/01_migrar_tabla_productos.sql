-- RC Conversiones - ampliación de la tabla productos
-- Ejecutar UNA sola vez antes de importar el catálogo.

ALTER TABLE productos
    ADD COLUMN codigo VARCHAR(80) NULL AFTER id,
    ADD COLUMN subcategoria VARCHAR(180) NULL AFTER categoria,
    ADD COLUMN caracteristicas TEXT NULL AFTER descripcion;

ALTER TABLE productos
    ADD UNIQUE KEY uk_productos_codigo (codigo);
