CREATE DATABASE IF NOT EXISTS sistema_asistencia_eventos_st
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sistema_asistencia_eventos_st;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS historial_visitas;
DROP TABLE IF EXISTS historial_eventos;
DROP TABLE IF EXISTS cierres_diarios;
DROP TABLE IF EXISTS registros_ingreso;
DROP TABLE IF EXISTS persona_transporte;
DROP TABLE IF EXISTS persona_participacion;
DROP TABLE IF EXISTS vehiculos;
DROP TABLE IF EXISTS evento_estacionamientos;
DROP TABLE IF EXISTS evento_unidades;
DROP TABLE IF EXISTS eventos;
DROP TABLE IF EXISTS personas;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS unidades;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE roles (
  id_rol INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE unidades (
  id_unidad INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL,
  estado ENUM('ACTIVA', 'INACTIVA') NOT NULL DEFAULT 'ACTIVA',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  id_rol INT NOT NULL,
  id_unidad INT NULL,
  estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_roles FOREIGN KEY (id_rol) REFERENCES roles(id_rol),
  CONSTRAINT fk_usuarios_unidades FOREIGN KEY (id_unidad) REFERENCES unidades(id_unidad) ON DELETE SET NULL,
  INDEX idx_usuarios_rol (id_rol),
  INDEX idx_usuarios_unidad (id_unidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE eventos (
  id_evento INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  codigo_evento VARCHAR(50) NOT NULL UNIQUE,
  fecha_inicio DATE NOT NULL,
  fecha_termino DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_termino TIME NOT NULL,
  estado ENUM('PROGRAMADO', 'ACTIVO', 'FINALIZADO') NOT NULL DEFAULT 'PROGRAMADO',
  creado_por INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_eventos_creado_por FOREIGN KEY (creado_por) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  INDEX idx_eventos_estado (estado),
  INDEX idx_eventos_fecha (fecha_inicio, fecha_termino)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE evento_unidades (
  id_evento INT NOT NULL,
  id_unidad INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_evento, id_unidad),
  CONSTRAINT fk_evento_unidades_eventos FOREIGN KEY (id_evento) REFERENCES eventos(id_evento) ON DELETE CASCADE,
  CONSTRAINT fk_evento_unidades_unidades FOREIGN KEY (id_unidad) REFERENCES unidades(id_unidad) ON DELETE CASCADE,
  INDEX idx_evento_unidades_unidad (id_unidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE evento_estacionamientos (
  id_estacionamiento INT AUTO_INCREMENT PRIMARY KEY,
  id_evento INT NOT NULL,
  id_unidad INT NULL,
  numero_espacio INT NOT NULL,
  estado ENUM('DISPONIBLE', 'ASIGNADO', 'OCUPADO') NOT NULL DEFAULT 'DISPONIBLE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_evento_estacionamientos_eventos FOREIGN KEY (id_evento) REFERENCES eventos(id_evento) ON DELETE CASCADE,
  CONSTRAINT fk_evento_estacionamientos_unidades FOREIGN KEY (id_unidad) REFERENCES unidades(id_unidad) ON DELETE SET NULL,
  UNIQUE KEY uq_estacionamiento_evento_numero (id_evento, numero_espacio),
  INDEX idx_evento_estacionamientos_evento (id_evento),
  INDEX idx_evento_estacionamientos_unidad (id_unidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE personas (
  id_persona INT AUTO_INCREMENT PRIMARY KEY,
  tipo_documento ENUM('RUT', 'CEDULA', 'PASAPORTE', 'EXTRANJERO') NOT NULL,
  numero_documento VARCHAR(50) NOT NULL,
  nombre_completo VARCHAR(150) NOT NULL,
  correo VARCHAR(150) NULL,
  telefono VARCHAR(30) NULL,
  estado ENUM('ACTIVA', 'INACTIVA') NOT NULL DEFAULT 'ACTIVA',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_personas_documento (tipo_documento, numero_documento),
  INDEX idx_personas_nombre (nombre_completo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE vehiculos (
  id_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
  id_conductor INT NULL,
  patente VARCHAR(20) NOT NULL UNIQUE,
  marca VARCHAR(60) NULL,
  modelo VARCHAR(60) NULL,
  color VARCHAR(60) NULL,
  observacion VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vehiculos_conductor FOREIGN KEY (id_conductor) REFERENCES personas(id_persona) ON DELETE SET NULL,
  INDEX idx_vehiculos_conductor (id_conductor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE persona_participacion (
  id_participacion INT AUTO_INCREMENT PRIMARY KEY,
  id_persona INT NOT NULL,
  id_evento INT NULL,
  id_unidad INT NULL,
  tipo_participacion ENUM('EVENTO', 'VISITA_DIARIA') NOT NULL,
  glosa_visita VARCHAR(255) NULL,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  registrado_por INT NULL,
  estado ENUM('PENDIENTE', 'INGRESADO') NOT NULL DEFAULT 'PENDIENTE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_participacion_personas FOREIGN KEY (id_persona) REFERENCES personas(id_persona) ON DELETE CASCADE,
  CONSTRAINT fk_participacion_eventos FOREIGN KEY (id_evento) REFERENCES eventos(id_evento) ON DELETE CASCADE,
  CONSTRAINT fk_participacion_unidades FOREIGN KEY (id_unidad) REFERENCES unidades(id_unidad) ON DELETE SET NULL,
  CONSTRAINT fk_participacion_usuarios FOREIGN KEY (registrado_por) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  UNIQUE KEY uq_participacion_unica (id_persona, id_evento, tipo_participacion),
  INDEX idx_participacion_persona (id_persona),
  INDEX idx_participacion_evento (id_evento, tipo_participacion),
  INDEX idx_participacion_unidad (id_unidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE persona_transporte (
  id_transporte INT AUTO_INCREMENT PRIMARY KEY,
  id_persona INT NOT NULL,
  id_vehiculo INT NULL,
  tipo_llegada ENUM('A_PIE', 'VEHICULO_PROPIO', 'OTRO') NOT NULL DEFAULT 'A_PIE',
  conductor_id INT NULL,
  documento_conductor VARCHAR(50) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_transporte_personas FOREIGN KEY (id_persona) REFERENCES personas(id_persona) ON DELETE CASCADE,
  CONSTRAINT fk_transporte_vehiculos FOREIGN KEY (id_vehiculo) REFERENCES vehiculos(id_vehiculo) ON DELETE SET NULL,
  CONSTRAINT fk_transporte_conductor FOREIGN KEY (conductor_id) REFERENCES personas(id_persona) ON DELETE SET NULL,
  UNIQUE KEY uq_transporte_persona (id_persona),
  INDEX idx_transporte_vehiculo (id_vehiculo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE registros_ingreso (
  id_registro INT AUTO_INCREMENT PRIMARY KEY,
  id_persona INT NOT NULL,
  id_participacion INT NOT NULL,
  id_evento INT NULL,
  tipo_participacion ENUM('EVENTO', 'VISITA_DIARIA') NOT NULL,
  id_usuario_guardia INT NULL,
  id_vehiculo INT NULL,
  fecha_ingreso DATE NOT NULL,
  hora_ingreso TIME NOT NULL,
  estado ENUM('INGRESADO') NOT NULL DEFAULT 'INGRESADO',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_registros_personas FOREIGN KEY (id_persona) REFERENCES personas(id_persona) ON DELETE CASCADE,
  CONSTRAINT fk_registros_participacion FOREIGN KEY (id_participacion) REFERENCES persona_participacion(id_participacion) ON DELETE CASCADE,
  CONSTRAINT fk_registros_eventos FOREIGN KEY (id_evento) REFERENCES eventos(id_evento) ON DELETE SET NULL,
  CONSTRAINT fk_registros_usuarios FOREIGN KEY (id_usuario_guardia) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  CONSTRAINT fk_registros_vehiculos FOREIGN KEY (id_vehiculo) REFERENCES vehiculos(id_vehiculo) ON DELETE SET NULL,
  UNIQUE KEY uq_registro_participacion (id_participacion),
  UNIQUE KEY uq_registro_persona_evento (id_persona, id_evento, tipo_participacion),
  INDEX idx_registros_fecha (fecha_ingreso, hora_ingreso)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cierres_diarios (
  id_cierre INT AUTO_INCREMENT PRIMARY KEY,
  fecha_cierre DATE NOT NULL UNIQUE,
  usuario_cierre INT NULL,
  total_visitas INT NOT NULL DEFAULT 0,
  total_ingresos INT NOT NULL DEFAULT 0,
  total_salidas INT NOT NULL DEFAULT 0,
  total_vehiculos INT NOT NULL DEFAULT 0,
  observaciones VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cierres_usuarios FOREIGN KEY (usuario_cierre) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE historial_eventos (
  id_historial_evento INT AUTO_INCREMENT PRIMARY KEY,
  id_evento INT NULL,
  nombre_evento VARCHAR(150) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_termino DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_termino TIME NOT NULL,
  total_unidades INT NOT NULL DEFAULT 0,
  total_personas INT NOT NULL DEFAULT 0,
  total_asistentes INT NOT NULL DEFAULT 0,
  total_ausentes INT NOT NULL DEFAULT 0,
  total_vehiculos INT NOT NULL DEFAULT 0,
  estacionamientos_asignados INT NOT NULL DEFAULT 0,
  estacionamientos_utilizados INT NOT NULL DEFAULT 0,
  fecha_cierre DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accion VARCHAR(80) NOT NULL DEFAULT 'CIERRE',
  detalle TEXT NULL,
  usuario_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_historial_eventos_eventos FOREIGN KEY (id_evento) REFERENCES eventos(id_evento) ON DELETE SET NULL,
  CONSTRAINT fk_historial_eventos_usuarios FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  INDEX idx_historial_eventos_evento (id_evento),
  INDEX idx_historial_eventos_cierre (fecha_cierre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE historial_visitas (
  id_historial_visita INT AUTO_INCREMENT PRIMARY KEY,
  id_cierre INT NULL,
  id_persona INT NULL,
  id_participacion INT NULL,
  nombre_persona VARCHAR(150) NOT NULL,
  documento VARCHAR(50) NOT NULL,
  unidad VARCHAR(120) NOT NULL,
  motivo VARCHAR(255) NULL,
  tipo_llegada VARCHAR(30) NULL,
  patente VARCHAR(20) NULL,
  hora_ingreso DATETIME NULL,
  hora_salida DATETIME NULL,
  accion VARCHAR(80) NOT NULL DEFAULT 'REGISTRO',
  detalle TEXT NULL,
  usuario_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_historial_visitas_cierres FOREIGN KEY (id_cierre) REFERENCES cierres_diarios(id_cierre) ON DELETE SET NULL,
  CONSTRAINT fk_historial_visitas_personas FOREIGN KEY (id_persona) REFERENCES personas(id_persona) ON DELETE SET NULL,
  CONSTRAINT fk_historial_visitas_participacion FOREIGN KEY (id_participacion) REFERENCES persona_participacion(id_participacion) ON DELETE SET NULL,
  CONSTRAINT fk_historial_visitas_usuarios FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  INDEX idx_historial_visitas_cierre (id_cierre),
  INDEX idx_historial_visitas_persona (id_persona),
  INDEX idx_historial_visitas_participacion (id_participacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (nombre) VALUES
('Administrador'),
('Encargado'),
('Guardia');

INSERT INTO unidades (nombre, descripcion, estado) VALUES
('Direccion', 'Zona central y coordinacion general', 'ACTIVA'),
('Informatica', 'Soporte, sistemas y redes', 'ACTIVA'),
('Seguridad', 'Control de acceso y vigilancia', 'ACTIVA');

INSERT INTO usuarios (nombre, correo, password_hash, id_rol, id_unidad, estado) VALUES
('Admin General', 'admin@sistema.cl', '$2b$10$U3MB4ASgoGRKN7CmpZA6oOinUbdKNQXTdBZz/fOJYZTwZs92r9xaq', 1, NULL, 'ACTIVO'),
('Encargado Informatica', 'informatica@sistema.cl', '$2b$10$dAqgFcmcyrmcgF/.1YjuaeUA6FZIS8lN8xBg1U4W3KpMBEsY4Bn.G', 2, 2, 'ACTIVO'),
('Guardia Principal', 'guardia@sistema.cl', '$2b$10$9sI4bQqILLsFGtxoRS82buVDiA7g2Ukq5HW7det4PSQHUuXmB2gUe', 3, 3, 'ACTIVO');

INSERT INTO eventos (nombre, codigo_evento, fecha_inicio, fecha_termino, hora_inicio, hora_termino, estado, creado_por) VALUES
('Seminario Innovacion 2026', 'EV-2026-014', '2026-06-21', '2026-06-21', '09:00:00', '18:00:00', 'ACTIVO', 1),
('Jornada Academica', 'EV-2026-015', '2026-06-22', '2026-06-22', '08:30:00', '14:00:00', 'PROGRAMADO', 1);

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
('CEDULA', '10000000-8', 'Gonzalo Tapia', 'gonzalo@example.com', '+56911111111', 'ACTIVA'),
('CEDULA', '11000000-6', 'Camila Henriquez', 'camila@example.com', '+56922222222', 'ACTIVA'),
('PASAPORTE', 'US459061', 'John Smith', 'john@example.com', '+56933333333', 'ACTIVA'),
('CEDULA', '12000000-4', 'Sebastian Yanez', 'sebas@example.com', '+56944444444', 'ACTIVA'),
('CEDULA', '13000000-2', 'Paula Munoz', 'paula@example.com', '+56955555555', 'ACTIVA');

INSERT INTO vehiculos (id_conductor, patente, marca, modelo, color, observacion) VALUES
(1, 'KLPW88', 'Suzuki', 'Swift', 'Azul', NULL),
(2, 'RTFS42', 'Mazda', '3', 'Gris', NULL),
(4, 'XXYY99', 'Chevrolet', 'Sail', 'Rojo', NULL);

INSERT INTO persona_participacion (id_persona, id_evento, id_unidad, tipo_participacion, glosa_visita, fecha_registro, registrado_por, estado) VALUES
(1, 1, 2, 'EVENTO', NULL, '2026-06-21 08:00:00', 2, 'INGRESADO'),
(2, 1, 2, 'EVENTO', NULL, '2026-06-21 08:10:00', 2, 'PENDIENTE'),
(3, NULL, 3, 'VISITA_DIARIA', 'Revision de sistemas', '2026-06-22 08:30:00', 2, 'INGRESADO'),
(4, 2, 1, 'EVENTO', NULL, '2026-06-22 08:45:00', 2, 'PENDIENTE'),
(5, NULL, 1, 'VISITA_DIARIA', 'Reunion administrativa', '2026-06-22 09:00:00', 2, 'PENDIENTE');

INSERT INTO persona_transporte (id_persona, id_vehiculo, tipo_llegada, conductor_id, documento_conductor) VALUES
(1, 1, 'VEHICULO_PROPIO', 1, '10000000-8'),
(2, 2, 'VEHICULO_PROPIO', 2, '11000000-6'),
(3, NULL, 'A_PIE', NULL, 'US459061'),
(4, 3, 'VEHICULO_PROPIO', 4, '12000000-4'),
(5, NULL, 'A_PIE', NULL, '13000000-2');

INSERT INTO registros_ingreso (id_persona, id_participacion, id_evento, tipo_participacion, id_usuario_guardia, id_vehiculo, fecha_ingreso, hora_ingreso, estado) VALUES
(1, 1, 1, 'EVENTO', 3, 1, '2026-06-21', '08:45:00', 'INGRESADO'),
(3, 3, NULL, 'VISITA_DIARIA', 3, NULL, '2026-06-22', '09:10:00', 'INGRESADO');

INSERT INTO cierres_diarios (fecha_cierre, usuario_cierre, total_visitas, total_ingresos, total_salidas, total_vehiculos, observaciones) VALUES
('2026-06-22', 3, 2, 2, 0, 1, 'Carga de pruebas inicial.');

INSERT INTO historial_eventos (
  id_evento, nombre_evento, fecha_inicio, fecha_termino, hora_inicio, hora_termino,
  total_unidades, total_personas, total_asistentes, total_ausentes, total_vehiculos,
  estacionamientos_asignados, estacionamientos_utilizados, fecha_cierre, accion, detalle, usuario_id
) VALUES
(1, 'Seminario Innovacion 2026', '2026-06-21', '2026-06-21', '09:00:00', '18:00:00', 3, 2, 1, 1, 2, 3, 1, '2026-06-21 18:30:00', 'CIERRE', 'Evento inicial cargado por semilla.', 1),
(2, 'Jornada Academica', '2026-06-22', '2026-06-22', '08:30:00', '14:00:00', 2, 2, 0, 2, 1, 2, 0, '2026-06-22 14:15:00', 'CIERRE', 'Evento programado para pruebas.', 1);

INSERT INTO historial_visitas (
  id_cierre, id_persona, id_participacion, nombre_persona, documento, unidad, motivo,
  tipo_llegada, patente, hora_ingreso, hora_salida, accion, detalle, usuario_id
) VALUES
(1, 1, 1, 'Gonzalo Tapia', '10000000-8', 'Informatica', 'Persona registrada en evento semilla.', 'VEHICULO_PROPIO', 'KLPW88', '2026-06-21 08:45:00', NULL, 'REGISTRO', 'Registro de evento inicial.', 2),
(1, 3, 3, 'John Smith', 'US459061', 'Seguridad', 'Visita diaria inicial.', 'A_PIE', NULL, '2026-06-22 09:10:00', NULL, 'REGISTRO', 'Visita diaria inicial.', 2);
