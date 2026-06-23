import db from '../config/database.js';

export async function findPersonByDocumento(tipoDocumento, numeroDocumento) {
  const [rows] = await db.execute(
    `SELECT id_persona AS id, tipo_documento, numero_documento, nombre_completo, correo, telefono, estado
    FROM personas
    WHERE tipo_documento = ? AND numero_documento = ?
    LIMIT 1`,
    [tipoDocumento, numeroDocumento]
  );
  return rows[0] || null;
}

export async function findPersonById(id) {
  const [rows] = await db.execute(
    `SELECT id_persona AS id, tipo_documento, numero_documento, nombre_completo, correo, telefono, estado
    FROM personas
    WHERE id_persona = ?
    LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function createPerson({ tipo_documento, numero_documento, nombre_completo, correo, telefono, estado = 'ACTIVA' }) {
  const [result] = await db.execute(
    `INSERT INTO personas (tipo_documento, numero_documento, nombre_completo, correo, telefono, estado)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [tipo_documento, numero_documento, nombre_completo, correo || null, telefono || null, estado]
  );
  return result.insertId;
}

export async function updatePerson(id, { tipo_documento, numero_documento, nombre_completo, correo, telefono, estado }) {
  await db.execute(
    `UPDATE personas
    SET tipo_documento = ?, numero_documento = ?, nombre_completo = ?, correo = ?, telefono = ?, estado = ?
    WHERE id_persona = ?`,
    [tipo_documento, numero_documento, nombre_completo, correo || null, telefono || null, estado, id]
  );
}

export async function deletePerson(id) {
  await db.execute('DELETE FROM personas WHERE id_persona = ?', [id]);
}

function personSelect() {
  return `
    p.id_persona AS id,
    p.tipo_documento,
    p.numero_documento,
    p.nombre_completo,
    p.correo,
    p.telefono,
    pp.id_participacion,
    pp.id_evento AS evento_id,
    pp.id_unidad AS unidad_id,
    pp.tipo_participacion,
    pp.glosa_visita,
    pp.fecha_registro,
    pp.estado AS participacion_estado,
    e.nombre AS evento_nombre,
    u.nombre AS unidad_nombre,
    ri.id_registro AS ingreso_id,
    ri.fecha_ingreso,
    ri.estado AS ingreso_estado,
    pt.tipo_llegada,
    pt.id_vehiculo,
    v.patente,
    v.marca,
    v.modelo,
    v.color,
    conductor.nombre_completo AS conductor_nombre,
    conductor.numero_documento AS conductor_documento
  `;
}

export async function listPeopleByEvent(eventoId, search = '', unidadId = null) {
  const term = `%${search}%`;
  const [rows] = await db.execute(
    `SELECT ${personSelect()}
    FROM persona_participacion pp
    JOIN personas p ON p.id_persona = pp.id_persona
    LEFT JOIN eventos e ON e.id_evento = pp.id_evento
    LEFT JOIN unidades u ON u.id_unidad = pp.id_unidad
    LEFT JOIN registros_ingreso ri ON ri.id_participacion = pp.id_participacion
    LEFT JOIN persona_transporte pt ON pt.id_persona = p.id_persona
    LEFT JOIN vehiculos v ON v.id_vehiculo = pt.id_vehiculo
    LEFT JOIN personas conductor ON conductor.id_persona = v.id_conductor
    WHERE pp.tipo_participacion = 'EVENTO'
      AND pp.id_evento = ?
      AND (? IS NULL OR pp.id_unidad = ?)
      AND (
        p.nombre_completo LIKE ? OR p.numero_documento LIKE ? OR COALESCE(v.patente, '') LIKE ?
      )
    ORDER BY p.nombre_completo ASC`,
    [eventoId, unidadId, unidadId, term, term, term]
  );
  return rows;
}

export async function listDailyVisitors(search = '', unidadId = null) {
  const term = `%${search}%`;
  const [rows] = await db.execute(
    `SELECT ${personSelect()}
    FROM persona_participacion pp
    JOIN personas p ON p.id_persona = pp.id_persona
    LEFT JOIN eventos e ON e.id_evento = pp.id_evento
    LEFT JOIN unidades u ON u.id_unidad = pp.id_unidad
    LEFT JOIN registros_ingreso ri ON ri.id_participacion = pp.id_participacion
    LEFT JOIN persona_transporte pt ON pt.id_persona = p.id_persona
    LEFT JOIN vehiculos v ON v.id_vehiculo = pt.id_vehiculo
    LEFT JOIN personas conductor ON conductor.id_persona = v.id_conductor
    WHERE pp.tipo_participacion = 'VISITA_DIARIA'
      AND (? IS NULL OR pp.id_unidad = ?)
      AND (
        p.nombre_completo LIKE ? OR p.numero_documento LIKE ? OR COALESCE(v.patente, '') LIKE ?
      )
    ORDER BY p.nombre_completo ASC`,
    [unidadId, unidadId, term, term, term]
  );
  return rows;
}

export async function listPeopleForGuardia({ scope, eventoId, search = '' }) {
  if (scope === 'diaria') {
    return listDailyVisitors(search, null);
  }
  return listPeopleByEvent(eventoId, search, null);
}

export async function getVehicleDetailsByPersonId(personaId) {
  const [rows] = await db.execute(
    `SELECT p.id_persona AS id, p.nombre_completo, p.numero_documento, p.tipo_documento,
      v.id_vehiculo, v.patente, v.marca, v.modelo, v.color,
      COALESCE(conductor.nombre_completo, p.nombre_completo) AS conductor_nombre,
      COALESCE(conductor.numero_documento, p.numero_documento) AS conductor_documento
    FROM persona_transporte pt
    JOIN personas p ON p.id_persona = pt.id_persona
    LEFT JOIN vehiculos v ON v.id_vehiculo = pt.id_vehiculo
    LEFT JOIN personas conductor ON conductor.id_persona = v.id_conductor
    WHERE pt.id_persona = ?
    LIMIT 1`,
    [personaId]
  );
  return rows[0] || null;
}

export async function listPeopleSummaryByEvent(eventoId) {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS total_personas,
      COALESCE(SUM(CASE WHEN ri.id_registro IS NOT NULL THEN 1 ELSE 0 END), 0) AS total_ingresos,
      COALESCE(SUM(CASE WHEN ri.id_registro IS NULL THEN 1 ELSE 0 END), 0) AS total_pendientes
    FROM persona_participacion pp
    LEFT JOIN registros_ingreso ri ON ri.id_participacion = pp.id_participacion
    WHERE pp.id_evento = ? AND pp.tipo_participacion = 'EVENTO'`,
    [eventoId]
  );
  return rows[0] || { total_personas: 0, total_ingresos: 0, total_pendientes: 0 };
}

export async function listDailySummary(unidadId = null) {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS total_personas,
      COALESCE(SUM(CASE WHEN ri.id_registro IS NOT NULL THEN 1 ELSE 0 END), 0) AS total_ingresos,
      COALESCE(SUM(CASE WHEN ri.id_registro IS NULL THEN 1 ELSE 0 END), 0) AS total_pendientes
    FROM persona_participacion pp
    LEFT JOIN registros_ingreso ri ON ri.id_participacion = pp.id_participacion
    WHERE pp.tipo_participacion = 'VISITA_DIARIA' AND (? IS NULL OR pp.id_unidad = ?)`,
    [unidadId, unidadId]
  );
  return rows[0] || { total_personas: 0, total_ingresos: 0, total_pendientes: 0 };
}
