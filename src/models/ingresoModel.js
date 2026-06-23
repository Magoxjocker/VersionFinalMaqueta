import db from '../config/database.js';

export async function findIngreso(personaId, eventoId, tipoParticipacion) {
  const [rows] = await db.execute(
    `SELECT ri.id_registro AS id, ri.id_participacion
    FROM registros_ingreso ri
    INNER JOIN persona_participacion pp ON pp.id_participacion = ri.id_participacion
    WHERE pp.id_persona = ? AND pp.id_evento <=> ? AND pp.tipo_participacion = ?
    LIMIT 1`,
    [personaId, eventoId || null, tipoParticipacion]
  );
  return rows[0] || null;
}

export async function findIngresoByParticipacionId(participacionId) {
  const [rows] = await db.execute(
    `SELECT id_registro AS id, id_participacion, fecha_ingreso, estado
    FROM registros_ingreso
    WHERE id_participacion = ?
    LIMIT 1`,
    [participacionId]
  );
  return rows[0] || null;
}

export async function createIngreso({ personaId, participacionId, usuarioGuardiaId, eventoId = null, tipoParticipacion, vehiculoId = null }) {
  const [result] = await db.execute(
    `INSERT INTO registros_ingreso (
      id_persona, id_participacion, id_usuario_guardia, fecha_ingreso, hora_ingreso, estado
    )
    VALUES (?, ?, ?, CURDATE(), CURTIME(), 'INGRESADO')`,
    [personaId, participacionId, usuarioGuardiaId || null]
  );
  return result.insertId;
}

export async function closeIngreso(ingresoId) {
  await db.execute(
    `UPDATE registros_ingreso
    SET estado = 'INGRESADO'
    WHERE id_registro = ?`,
    [ingresoId]
  );
}

export async function listIngresos() {
  const [rows] = await db.execute(
    `SELECT ri.id_registro AS id, p.nombre_completo, p.numero_documento, pp.tipo_participacion,
      e.nombre AS evento_nombre, u.nombre AS unidad_nombre, ri.fecha_ingreso, ri.estado,
      v.patente, v.marca, v.modelo, v.color
    FROM registros_ingreso ri
    JOIN personas p ON p.id_persona = ri.id_persona
    INNER JOIN persona_participacion pp ON pp.id_participacion = ri.id_participacion
    LEFT JOIN eventos e ON e.id_evento = pp.id_evento
    LEFT JOIN unidades u ON u.id_unidad = pp.id_unidad
    LEFT JOIN persona_transporte pt ON pt.id_persona = p.id_persona
    LEFT JOIN vehiculos v ON v.id_vehiculo = pt.id_vehiculo
    ORDER BY ri.fecha_ingreso DESC, ri.id_registro DESC`
  );
  return rows;
}

export async function listIngresosByEvento(eventoId) {
  const [rows] = await db.execute(
    `SELECT ri.id_registro AS id, p.id_persona, p.nombre_completo, p.numero_documento,
      ri.fecha_ingreso, ri.estado,
      v.patente, v.marca, v.modelo, v.color
    FROM registros_ingreso ri
    JOIN personas p ON p.id_persona = ri.id_persona
    INNER JOIN persona_participacion pp ON pp.id_participacion = ri.id_participacion
    LEFT JOIN persona_transporte pt ON pt.id_persona = p.id_persona
    LEFT JOIN vehiculos v ON v.id_vehiculo = pt.id_vehiculo
    WHERE pp.id_evento <=> ? AND pp.tipo_participacion = 'EVENTO'
    ORDER BY p.nombre_completo ASC`,
    [eventoId || null]
  );
  return rows;
}

export async function listIngresosDiarios() {
  const [rows] = await db.execute(
    `SELECT ri.id_registro AS id, p.id_persona, p.nombre_completo, p.numero_documento,
      ri.fecha_ingreso, ri.estado,
      v.patente, v.marca, v.modelo, v.color
    FROM registros_ingreso ri
    JOIN personas p ON p.id_persona = ri.id_persona
    INNER JOIN persona_participacion pp ON pp.id_participacion = ri.id_participacion
    LEFT JOIN persona_transporte pt ON pt.id_persona = p.id_persona
    LEFT JOIN vehiculos v ON v.id_vehiculo = pt.id_vehiculo
    WHERE pp.tipo_participacion = 'VISITA_DIARIA'
    ORDER BY p.nombre_completo ASC`
  );
  return rows;
}
