USE sistema_asistencia_eventos_st;

INSERT INTO roles (nombre) VALUES
('Administrador'),
('Encargado'),
('Guardia');

INSERT INTO unidades (nombre, descripcion, estado) VALUES
('Dirección', 'Zona central y coordinación general', 'ACTIVA'),
('Informática', 'Soporte, sistemas y redes', 'ACTIVA'),
('Seguridad', 'Control de acceso y vigilancia', 'ACTIVA');

INSERT INTO usuarios (nombre, correo, password_hash, id_rol, id_unidad, estado) VALUES
('Admin General', 'admin@sistema.cl', '$2b$10$U3MB4ASgoGRKN7CmpZA6oOinUbdKNQXTdBZz/fOJYZTwZs92r9xaq', 1, NULL, 'ACTIVO'),
('Encargado Informatica', 'informatica@sistema.cl', '$2b$10$dAqgFcmcyrmcgF/.1YjuaeUA6FZIS8lN8xBg1U4W3KpMBEsY4Bn.G', 2, 2, 'ACTIVO'),
('Guardia Principal', 'guardia@sistema.cl', '$2b$10$9sI4bQqILLsFGtxoRS82buVDiA7g2Ukq5HW7det4PSQHUuXmB2gUe', 3, 3, 'ACTIVO');

INSERT INTO eventos (nombre, codigo_evento, fecha_inicio, fecha_termino, hora_inicio, hora_termino, estado, creado_por) VALUES
('Seminario Innovación 2026', 'EV-2026-014', '2026-06-21', '2026-06-21', '09:00:00', '18:00:00', 'ACTIVO', 1),
('Jornada Académica', 'EV-2026-015', '2026-06-22', '2026-06-22', '08:30:00', '14:00:00', 'PROGRAMADO', 1);

INSERT INTO evento_unidades (id_evento, id_unidad) VALUES
(1, 1),
(1, 2),
(1, 3),
(2, 1),
(2, 3);

INSERT INTO evento_estacionamientos (id_evento, id_unidad, numero_espacio, estado) VALUES
(1, 1, 1, 'ASIGNADO'),
(1, 2, 2, 'ASIGNADO'),
(1, 3, 3, 'OCUPADO'),
(2, 1, 4, 'DISPONIBLE'),
(2, 3, 5, 'ASIGNADO');

INSERT INTO personas (tipo_documento, numero_documento, nombre_completo, correo, telefono, estado) VALUES
('RUT', '10000000-8', 'Gonzalo Tapia', 'gonzalo@example.com', '+56911111111', 'ACTIVO'),
('RUT', '11000000-6', 'Camila Henríquez', 'camila@example.com', '+56922222222', 'ACTIVO'),
('PASAPORTE', 'US459061', 'John Smith', 'john@example.com', '+56933333333', 'ACTIVO'),
('RUT', '12000000-4', 'Sebastián Yáñez', 'sebas@example.com', '+56944444444', 'ACTIVO'),
('RUT', '13000000-2', 'Paula Muñoz', 'paula@example.com', '+56955555555', 'ACTIVO');

INSERT INTO vehiculos (patente, marca, modelo, color, observacion, conductor_id) VALUES
('KLPW88', 'Suzuki', 'Swift', 'Azul', NULL, 1),
('RTFS42', 'Mazda', '3', 'Gris', NULL, 2),
('XXYY99', 'Chevrolet', 'Sail', 'Rojo', NULL, 4);

INSERT INTO persona_participacion (id_persona, id_evento, id_unidad, tipo_participacion, glosa_visita, fecha_registro, registrado_por, estado) VALUES
(1, 1, 2, 'EVENTO', NULL, '2026-06-21 08:00:00', 2, 'INGRESADO'),
(2, 1, 2, 'EVENTO', NULL, '2026-06-21 08:10:00', 2, 'PENDIENTE'),
(3, NULL, 3, 'VISITA_DIARIA', 'Revisión de sistemas', '2026-06-22 08:30:00', 2, 'INGRESADO'),
(4, 2, 1, 'EVENTO', NULL, '2026-06-22 08:45:00', 2, 'PENDIENTE'),
(5, NULL, 1, 'VISITA_DIARIA', 'Reunión administrativa', '2026-06-22 09:00:00', 2, 'PENDIENTE');

INSERT INTO persona_transporte (id_persona, id_vehiculo, tipo_llegada, conductor_id, documento_conductor) VALUES
(1, 1, 'VEHICULO_PROPIO', 1, '10000000-8'),
(2, 2, 'VEHICULO_PROPIO', 2, '11000000-6'),
(3, NULL, 'A_PIE', NULL, 'US459061'),
(4, 3, 'VEHICULO_PROPIO', 4, '12000000-4'),
(5, NULL, 'A_PIE', NULL, '13000000-2');

INSERT INTO registros_ingreso (id_persona, id_participacion, id_evento, tipo_participacion, fecha_ingreso, usuario_ingreso, id_vehiculo, estado) VALUES
(1, 1, 1, 'EVENTO', '2026-06-21 08:45:00', 3, 1, 'INGRESADO'),
(3, 3, NULL, 'VISITA_DIARIA', '2026-06-22 09:10:00', 3, NULL, 'INGRESADO');

INSERT INTO cierres_diarios (fecha_cierre, usuario_cierre, total_visitas, total_ingresos, total_salidas, total_vehiculos, observaciones) VALUES
('2026-06-22', 3, 2, 2, 0, 1, 'Carga de pruebas inicial.');

INSERT INTO historial_eventos (
  id_evento, nombre_evento, fecha_inicio, fecha_termino, hora_inicio, hora_termino,
  total_unidades, total_personas, total_asistentes, total_ausentes, total_vehiculos,
  estacionamientos_asignados, estacionamientos_utilizados, fecha_cierre, accion, detalle, usuario_id
) VALUES
(1, 'Seminario Innovación 2026', '2026-06-21', '2026-06-21', '09:00:00', '18:00:00', 3, 2, 1, 1, 2, 3, 1, '2026-06-21 18:30:00', 'CIERRE', 'Evento inicial cargado por semilla.', 1),
(2, 'Jornada Académica', '2026-06-22', '2026-06-22', '08:30:00', '14:00:00', 2, 2, 0, 2, 1, 2, 0, '2026-06-22 14:15:00', 'CIERRE', 'Evento programado para pruebas.', 1);

INSERT INTO historial_visitas (
  id_cierre, id_persona, id_participacion, nombre_persona, documento, unidad, motivo,
  tipo_llegada, patente, hora_ingreso, hora_salida, accion, detalle, usuario_id
) VALUES
(1, 1, 1, 'Gonzalo Tapia', '10000000-8', 'Informática', 'Persona registrada en evento semilla.', 'VEHICULO_PROPIO', 'KLPW88', '2026-06-21 08:45:00', NULL, 'REGISTRO', 'Registro de evento inicial.', 2),
(1, 3, 3, 'John Smith', 'US459061', 'Seguridad', 'Visita diaria inicial.', 'A_PIE', NULL, '2026-06-22 09:10:00', NULL, 'REGISTRO', 'Visita diaria inicial.', 2);
