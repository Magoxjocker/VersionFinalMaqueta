import db from '../config/database.js';

export async function getOrCreateTodayClosure(usuarioId, observaciones = null) {
  const [existingRows] = await db.execute(
    'SELECT id_cierre AS id FROM cierres_diarios WHERE fecha_cierre = CURDATE() LIMIT 1'
  );
  if (existingRows[0]) {
    return existingRows[0].id;
  }

  const [result] = await db.execute(
    'INSERT INTO cierres_diarios (fecha_cierre, usuario_cierre, total_visitas, total_ingresos, total_salidas, total_vehiculos, observaciones) VALUES (CURDATE(), ?, 0, 0, 0, 0, ?)',
    [usuarioId || null, observaciones || null]
  );
  return result.insertId;
}

export async function createHistorialEvento({
  eventoId,
  nombreEvento,
  fechaInicio,
  fechaTermino,
  horaInicio,
  horaTermino,
  totalUnidades,
  totalPersonas,
  totalAsistentes,
  totalAusentes,
  totalVehiculos,
  estacionamientosAsignados,
  estacionamientosUtilizados,
  fechaCierre,
}) {
  await db.execute(
    `INSERT INTO historial_eventos (
      id_evento, nombre_evento, fecha_inicio, fecha_termino, hora_inicio, hora_termino,
      total_unidades, total_personas, total_asistentes, total_ausentes, total_vehiculos,
      estacionamientos_asignados, estacionamientos_utilizados, fecha_cierre
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      eventoId,
      nombreEvento,
      fechaInicio,
      fechaTermino,
      horaInicio,
      horaTermino,
      totalUnidades || 0,
      totalPersonas || 0,
      totalAsistentes || 0,
      totalAusentes || 0,
      totalVehiculos || 0,
      estacionamientosAsignados || 0,
      estacionamientosUtilizados || 0,
      fechaCierre || new Date(),
    ]
  );
}

export async function createHistorialVisita({
  cierreId,
  personaId,
  participacionId,
  nombrePersona,
  documento,
  unidad,
  motivo,
  tipoLlegada,
  patente,
  horaIngreso,
  horaSalida,
  usuarioId = null,
  accion = 'REGISTRO',
  detalle = null,
}) {
  const cierre = cierreId || (await getOrCreateTodayClosure(usuarioId));
  await db.execute(
    `INSERT INTO historial_visitas (
      id_cierre, id_persona, id_participacion, nombre_persona, documento, unidad,
      motivo, tipo_llegada, patente, hora_ingreso, hora_salida
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      cierre,
      personaId,
      participacionId,
      nombrePersona || 'Sin nombre',
      documento || 'SIN DOCUMENTO',
      unidad || 'Sin unidad',
      motivo || null,
      tipoLlegada || null,
      patente || null,
      horaIngreso || null,
      horaSalida || null,
    ]
  );
}

export async function listHistorialEventos(limit = 20) {
  const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Math.trunc(Number(limit)) : 20;
  const [rows] = await db.execute(
    `SELECT he.id_historial_evento AS id, he.id_evento AS evento_id, he.nombre_evento AS evento_nombre,
      he.total_unidades, he.total_personas, he.total_asistentes, he.total_ausentes, he.total_vehiculos,
      he.estacionamientos_asignados, he.estacionamientos_utilizados, he.fecha_cierre,
      'CIERRE' AS accion, NULL AS detalle, he.created_at
    FROM historial_eventos he
    ORDER BY he.created_at DESC, he.id_historial_evento DESC
    LIMIT ${safeLimit}`
  );
  return rows;
}

export async function listHistorialVisitas(limit = 20) {
  const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Math.trunc(Number(limit)) : 20;
  const [rows] = await db.execute(
    `SELECT hv.id_historial_visita AS id, hv.id_persona AS persona_id, hv.id_participacion AS participacion_id,
      hv.nombre_persona AS persona_nombre, hv.documento, hv.unidad, hv.motivo, hv.tipo_llegada, hv.patente,
      COALESCE(e.nombre, 'Visita diaria') AS evento_nombre,
      'REGISTRO' AS accion, NULL AS detalle, hv.hora_ingreso, hv.hora_salida, hv.created_at
    FROM historial_visitas hv
    LEFT JOIN persona_participacion pp ON pp.id_participacion = hv.id_participacion
    LEFT JOIN eventos e ON e.id_evento = pp.id_evento
    ORDER BY hv.created_at DESC, hv.id_historial_visita DESC
    LIMIT ${safeLimit}`
  );
  return rows;
}
