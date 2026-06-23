import db from '../config/database.js';

function eventSummarySelect() {
  return `
    e.id_evento AS id,
    e.nombre,
    e.codigo_evento,
    e.fecha_inicio,
    e.fecha_termino,
    e.hora_inicio,
    e.hora_termino,
    e.estado,
    (SELECT COUNT(*) FROM evento_unidades eu WHERE eu.id_evento = e.id_evento) AS total_unidades,
    (SELECT COUNT(*) FROM persona_participacion pp WHERE pp.id_evento = e.id_evento AND pp.tipo_participacion = 'EVENTO') AS total_personas,
    (SELECT COUNT(*)
      FROM registros_ingreso ri
      INNER JOIN persona_participacion pp ON pp.id_participacion = ri.id_participacion
      WHERE pp.id_evento = e.id_evento AND pp.tipo_participacion = 'EVENTO') AS total_asistentes,
    GREATEST(
      (SELECT COUNT(*) FROM persona_participacion pp WHERE pp.id_evento = e.id_evento AND pp.tipo_participacion = 'EVENTO')
      - (SELECT COUNT(*)
          FROM registros_ingreso ri
          INNER JOIN persona_participacion pp ON pp.id_participacion = ri.id_participacion
          WHERE pp.id_evento = e.id_evento AND pp.tipo_participacion = 'EVENTO'),
      0
    ) AS total_ausentes,
    (SELECT COUNT(DISTINCT pt.id_vehiculo)
      FROM persona_participacion pp
      INNER JOIN persona_transporte pt ON pt.id_persona = pp.id_persona
      WHERE pp.id_evento = e.id_evento AND pp.tipo_participacion = 'EVENTO' AND pt.id_vehiculo IS NOT NULL) AS total_vehiculos,
    (SELECT COUNT(*) FROM evento_estacionamientos ee WHERE ee.id_evento = e.id_evento) AS estacionamientos_asignados,
    (SELECT COUNT(*) FROM evento_estacionamientos ee WHERE ee.id_evento = e.id_evento AND ee.estado = 'OCUPADO') AS estacionamientos_utilizados
  `;
}

export async function listEventos() {
  const [rows] = await db.execute(
    `SELECT ${eventSummarySelect()}
    FROM eventos e
    ORDER BY e.fecha_inicio DESC, e.hora_inicio DESC`
  );
  return rows;
}

export async function listEventosActivos() {
  const [rows] = await db.execute(
    `SELECT ${eventSummarySelect()}
    FROM eventos e
    WHERE e.estado IN ('PROGRAMADO', 'ACTIVO')
    ORDER BY e.fecha_inicio DESC, e.hora_inicio ASC`
  );
  return rows;
}

export async function listEventosActivosByUnidad(unidadId) {
  const [rows] = await db.execute(
    `SELECT e.id_evento AS id, e.nombre, e.codigo_evento, e.fecha_inicio, e.fecha_termino,
      e.hora_inicio, e.hora_termino, e.estado
    FROM eventos e
    INNER JOIN evento_unidades eu ON eu.id_evento = e.id_evento
    WHERE eu.id_unidad = ? AND e.estado IN ('PROGRAMADO', 'ACTIVO')
    ORDER BY e.fecha_inicio DESC, e.hora_inicio ASC`,
    [unidadId]
  );
  return rows;
}

export async function findEventoById(id) {
  const [rows] = await db.execute(
    'SELECT id_evento AS id, nombre, codigo_evento, fecha_inicio, fecha_termino, hora_inicio, hora_termino, estado FROM eventos WHERE id_evento = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

export async function createEvento({ creadoPor, nombre, codigo_evento, fecha_inicio, fecha_termino, hora_inicio, hora_termino, estado = 'PROGRAMADO' }) {
  const [result] = await db.execute(
    `INSERT INTO eventos (creado_por, codigo_evento, nombre, fecha_inicio, fecha_termino, hora_inicio, hora_termino, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [creadoPor || null, codigo_evento, nombre, fecha_inicio, fecha_termino, hora_inicio, hora_termino, estado]
  );
  return result.insertId;
}

export async function updateEvento(id, { nombre, codigo_evento, fecha_inicio, fecha_termino, hora_inicio, hora_termino, estado }) {
  await db.execute(
    `UPDATE eventos SET nombre = ?, codigo_evento = ?, fecha_inicio = ?, fecha_termino = ?, hora_inicio = ?, hora_termino = ?, estado = ?
    WHERE id_evento = ?`,
    [nombre, codigo_evento, fecha_inicio, fecha_termino, hora_inicio, hora_termino, estado, id]
  );
}

export async function finalizeEvento(id) {
  await db.execute("UPDATE eventos SET estado = 'FINALIZADO' WHERE id_evento = ?", [id]);
}

export async function deleteEvento(id) {
  await db.execute(
    `DELETE ri
    FROM registros_ingreso ri
    INNER JOIN persona_participacion pp ON pp.id_participacion = ri.id_participacion
    WHERE pp.id_evento = ?`,
    [id]
  );
  await db.execute('DELETE FROM historial_visitas WHERE id_participacion IN (SELECT id_participacion FROM persona_participacion WHERE id_evento = ?)', [id]);
  await db.execute('DELETE FROM historial_eventos WHERE id_evento = ?', [id]);
  await db.execute('DELETE FROM persona_participacion WHERE id_evento = ?', [id]);
  await db.execute('DELETE FROM evento_unidades WHERE id_evento = ?', [id]);
  await db.execute('DELETE FROM evento_estacionamientos WHERE id_evento = ?', [id]);
  await db.execute('DELETE FROM eventos WHERE id_evento = ?', [id]);
}

export async function getEventHistorySnapshot(eventoId) {
  const [rows] = await db.execute(
    `SELECT ${eventSummarySelect()}
    FROM eventos e
    WHERE e.id_evento = ?
    LIMIT 1`,
    [eventoId]
  );
  return rows[0] || null;
}

export async function getActiveEventSummaries() {
  const [rows] = await db.execute(
    `SELECT ${eventSummarySelect()}
    FROM eventos e
    WHERE e.estado IN ('PROGRAMADO', 'ACTIVO')
    ORDER BY e.fecha_inicio DESC, e.hora_inicio ASC`
  );
  return rows;
}

export async function listEventUnits(eventoId) {
  const [rows] = await db.execute(
    `SELECT eu.id_evento, eu.id_unidad, u.nombre
    FROM evento_unidades eu
    JOIN unidades u ON u.id_unidad = eu.id_unidad
    WHERE eu.id_evento = ?
    ORDER BY u.nombre ASC`,
    [eventoId]
  );
  return rows;
}

export async function setEventUnits(eventoId, unitIds = []) {
  await db.execute('DELETE FROM evento_unidades WHERE id_evento = ?', [eventoId]);
  if (!unitIds.length) return;
  const rows = unitIds.map((idUnidad) => [eventoId, idUnidad]);
  await db.query('INSERT INTO evento_unidades (id_evento, id_unidad) VALUES ?', [rows]);
}

export async function listParkingByEvent(eventoId) {
  const [rows] = await db.execute(
    `SELECT ee.id_estacionamiento AS id, ee.id_evento AS evento_id, ee.id_unidad AS unidad_id, ee.numero_espacio AS espacio, ee.estado,
      u.nombre AS unidad_nombre
    FROM evento_estacionamientos ee
    LEFT JOIN unidades u ON u.id_unidad = ee.id_unidad
    WHERE ee.id_evento = ?
    ORDER BY ee.numero_espacio ASC`,
    [eventoId]
  );
  return rows;
}

export async function listParkingSummaryByEvent(eventoId) {
  const [rows] = await db.execute(
    `SELECT
      COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN ee.estado = 'DISPONIBLE' THEN 1 ELSE 0 END), 0) AS disponibles,
      COALESCE(SUM(CASE WHEN ee.estado = 'ASIGNADO' THEN 1 ELSE 0 END), 0) AS asignados,
      COALESCE(SUM(CASE WHEN ee.estado = 'OCUPADO' THEN 1 ELSE 0 END), 0) AS ocupados
    FROM evento_estacionamientos ee
    WHERE ee.id_evento = ?`,
    [eventoId]
  );
  return rows[0] || { total: 0, disponibles: 0, asignados: 0, ocupados: 0 };
}

export async function listParkingSummaryByUnidad(unidadId) {
  const [rows] = await db.execute(
    `SELECT
      COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN ee.estado = 'DISPONIBLE' THEN 1 ELSE 0 END), 0) AS disponibles,
      COALESCE(SUM(CASE WHEN ee.estado = 'ASIGNADO' THEN 1 ELSE 0 END), 0) AS asignados,
      COALESCE(SUM(CASE WHEN ee.estado = 'OCUPADO' THEN 1 ELSE 0 END), 0) AS ocupados
    FROM evento_estacionamientos ee
    WHERE ee.id_unidad = ?`,
    [unidadId]
  );
  return rows[0] || { total: 0, disponibles: 0, asignados: 0, ocupados: 0 };
}

export async function createParkingCards({ eventoId, totalEspacios }) {
  const total = Math.trunc(Number(totalEspacios));
  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }

  const [existingRows] = await db.execute(
    'SELECT numero_espacio FROM evento_estacionamientos WHERE id_evento = ? ORDER BY numero_espacio ASC',
    [eventoId]
  );

  const existingNumbers = new Set(existingRows.map((row) => Number(row.numero_espacio)));
  const values = [];
  for (let numero = 1; numero <= total; numero += 1) {
    if (!existingNumbers.has(numero)) {
      values.push([eventoId, null, numero, 'DISPONIBLE']);
    }
  }

  if (!values.length) {
    return existingRows.length;
  }

  await db.query(
    'INSERT INTO evento_estacionamientos (id_evento, id_unidad, numero_espacio, estado) VALUES ?',
    [values]
  );

  return existingRows.length + values.length;
}

export async function updateParkingSpace({ id, eventoId, unidadId, espacio }) {
  const estado = unidadId ? 'ASIGNADO' : 'DISPONIBLE';
  await db.execute(
    'UPDATE evento_estacionamientos SET id_evento = ?, id_unidad = ?, numero_espacio = ?, estado = ? WHERE id_estacionamiento = ?',
    [eventoId, unidadId || null, Number(espacio), estado, id]
  );
  return id;
}

export async function assignParkingSpaceToUnidad(id, { eventoId, unidadId }) {
  const estado = unidadId ? 'ASIGNADO' : 'DISPONIBLE';
  await db.execute(
    'UPDATE evento_estacionamientos SET id_evento = ?, id_unidad = ?, estado = ? WHERE id_estacionamiento = ?',
    [eventoId, unidadId || null, estado, id]
  );
  return id;
}

export async function takeAvailableParkingForUnidad(eventoId, unidadId) {
  const available = await findAvailableParkingForUnidad(eventoId, unidadId);
  if (!available) {
    return null;
  }

  await occupyParkingSpace(available.id);
  return available;
}

export async function findAvailableParkingForUnidad(eventoId, unidadId) {
  const [rows] = await db.execute(
    `SELECT id_estacionamiento AS id, numero_espacio
    FROM evento_estacionamientos
    WHERE id_evento = ? AND id_unidad = ? AND estado = 'ASIGNADO'
    ORDER BY numero_espacio ASC
    LIMIT 1`,
    [eventoId, unidadId]
  );

  return rows[0] || null;
}

export async function occupyParkingSpace(id) {
  await db.execute("UPDATE evento_estacionamientos SET estado = 'OCUPADO' WHERE id_estacionamiento = ?", [id]);
}

export async function deleteParkingSpace(id) {
  await db.execute('DELETE FROM evento_estacionamientos WHERE id_estacionamiento = ?', [id]);
}
