CREATE DATABASE IF NOT EXISTS sistema_asistencia_eventos_st
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sistema_asistencia_eventos_st;

CREATE TABLE IF NOT EXISTS roles (
  id_rol INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS unidades (
  id_unidad INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL,
  estado ENUM('ACTIVA', 'INACTIVA') NOT NULL DEFAULT 'ACTIVA'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  id_rol INT NOT NULL,
  id_unidad INT NULL,
  estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_roles FOREIGN KEY (id_rol) REFERENCES roles(id_rol),
  CONSTRAINT fk_usuarios_unidades FOREIGN KEY (id_unidad) REFERENCES unidades(id_unidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS eventos (
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
  CONSTRAINT fk_eventos_creado_por FOREIGN KEY (creado_por) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS evento_unidades (
  id_evento INT NOT NULL,
  id_unidad INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_evento, id_unidad),
  CONSTRAINT fk_evento_unidades_eventos FOREIGN KEY (id_evento) REFERENCES eventos(id_evento) ON DELETE CASCADE,
  CONSTRAINT fk_evento_unidades_unidades FOREIGN KEY (id_unidad) REFERENCES unidades(id_unidad) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS evento_estacionamientos (
  id_estacionamiento INT AUTO_INCREMENT PRIMARY KEY,
  id_evento INT NOT NULL,
  id_unidad INT NULL,
  numero_espacio INT NOT NULL,
  estado ENUM('DISPONIBLE', 'ASIGNADO', 'OCUPADO') NOT NULL DEFAULT 'DISPONIBLE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_evento_estacionamientos_eventos FOREIGN KEY (id_evento) REFERENCES eventos(id_evento) ON DELETE CASCADE,
  CONSTRAINT fk_evento_estacionamientos_unidades FOREIGN KEY (id_unidad) REFERENCES unidades(id_unidad) ON DELETE SET NULL,
  UNIQUE KEY uq_estacionamiento_evento_numero (id_evento, numero_espacio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS personas (
  id_persona INT AUTO_INCREMENT PRIMARY KEY,
  tipo_documento ENUM('RUT', 'PASAPORTE', 'CEDULA', 'EXTRANJERO') NOT NULL,
  numero_documento VARCHAR(50) NOT NULL,
  nombre_completo VARCHAR(150) NOT NULL,
  correo VARCHAR(150) NULL,
  telefono VARCHAR(30) NULL,
  estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_personas_documento (tipo_documento, numero_documento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vehiculos (
  id_vehiculo INT AUTO_INCREMENT PRIMARY KEY,
  patente VARCHAR(20) NOT NULL UNIQUE,
  marca VARCHAR(60) NULL,
  modelo VARCHAR(60) NULL,
  color VARCHAR(60) NULL,
  observacion VARCHAR(255) NULL,
  conductor_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vehiculos_conductor FOREIGN KEY (conductor_id) REFERENCES personas(id_persona) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS persona_participacion (
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
  UNIQUE KEY uq_participacion_unica (id_persona, id_evento, tipo_participacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS persona_transporte (
  id_persona INT PRIMARY KEY,
  id_vehiculo INT NULL,
  tipo_llegada ENUM('A_PIE', 'VEHICULO_PROPIO', 'OTRO') NOT NULL DEFAULT 'A_PIE',
  conductor_id INT NULL,
  documento_conductor VARCHAR(50) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_transporte_personas FOREIGN KEY (id_persona) REFERENCES personas(id_persona) ON DELETE CASCADE,
  CONSTRAINT fk_transporte_vehiculos FOREIGN KEY (id_vehiculo) REFERENCES vehiculos(id_vehiculo) ON DELETE SET NULL,
  CONSTRAINT fk_transporte_conductor FOREIGN KEY (conductor_id) REFERENCES personas(id_persona) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS registros_ingreso (
  id_registro INT AUTO_INCREMENT PRIMARY KEY,
  id_persona INT NOT NULL,
  id_participacion INT NOT NULL,
  id_evento INT NULL,
  tipo_participacion ENUM('EVENTO', 'VISITA_DIARIA') NOT NULL,
  fecha_ingreso DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usuario_ingreso INT NULL,
  id_vehiculo INT NULL,
  estado ENUM('INGRESADO') NOT NULL DEFAULT 'INGRESADO',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_registros_personas FOREIGN KEY (id_persona) REFERENCES personas(id_persona) ON DELETE CASCADE,
  CONSTRAINT fk_registros_participacion FOREIGN KEY (id_participacion) REFERENCES persona_participacion(id_participacion) ON DELETE CASCADE,
  CONSTRAINT fk_registros_eventos FOREIGN KEY (id_evento) REFERENCES eventos(id_evento) ON DELETE CASCADE,
  CONSTRAINT fk_registros_usuarios FOREIGN KEY (usuario_ingreso) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  CONSTRAINT fk_registros_vehiculos FOREIGN KEY (id_vehiculo) REFERENCES vehiculos(id_vehiculo) ON DELETE SET NULL,
  UNIQUE KEY uq_registro_participacion (id_participacion),
  UNIQUE KEY uq_registro_persona_evento (id_persona, id_evento, tipo_participacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cierres_diarios (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS historial_eventos (
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
  CONSTRAINT fk_historial_eventos_usuarios FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS historial_visitas (
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
  CONSTRAINT fk_historial_visitas_usuarios FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_personas_documento ON personas(tipo_documento, numero_documento);
CREATE INDEX idx_registros_fecha ON registros_ingreso(fecha_ingreso);
CREATE INDEX idx_eventos_estado ON eventos(estado);
CREATE INDEX idx_participacion_evento ON persona_participacion(id_evento, tipo_participacion);
