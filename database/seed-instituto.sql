USE sistema_asistencia_eventos_st;

INSERT INTO roles (nombre) VALUES
('Administrador'),
('Encargado'),
('Guardia');

INSERT INTO unidades (nombre, descripcion, estado) VALUES
('Direccion', 'Zona central y coordinacion general', 'ACTIVA'),
('Informatica', 'Soporte, sistemas y redes', 'ACTIVA'),
('Seguridad', 'Control de acceso y vigilancia', 'ACTIVA');

INSERT INTO usuarios (nombre, correo, password_hash, id_rol, id_unidad, estado) VALUES
('Admin General', 'admin@sistema.cl', '$2b$10$U3MB4ASgoGRKN7CmpZA6oOinUbdKNQXTdBZz/fOJYZTwZs92r9xaq', 1, 1, 'ACTIVO'),
('Encargado Informatica', 'informatica@sistema.cl', '$2b$10$dAqgFcmcyrmcgF/.1YjuaeUA6FZIS8lN8xBg1U4W3KpMBEsY4Bn.G', 2, 2, 'ACTIVO'),
('Guardia Principal', 'guardia@sistema.cl', '$2b$10$9sI4bQqILLsFGtxoRS82buVDiA7g2Ukq5HW7det4PSQHUuXmB2gUe', 3, 3, 'ACTIVO');
