import db from '../../src/config/database.js';
import { deleteEvento } from '../../src/models/eventoModel.js';

export function uniqueSuffix(prefix = 'test') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function uniqueDocumento(prefix = 'UT') {
  const timePart = Date.now().toString(36).slice(-5);
  const randomPart = Math.floor(Math.random() * 1000).toString(36).padStart(2, '0');
  return `${prefix}${timePart}${randomPart}`.slice(0, 15);
}

export async function getPersonIdByDocumento(tipoDocumento, numeroDocumento) {
  const [rows] = await db.execute(
    'SELECT id_persona AS id FROM personas WHERE tipo_documento = ? AND numero_documento = ? LIMIT 1',
    [tipoDocumento, numeroDocumento]
  );
  return rows[0]?.id || null;
}

export async function cleanupPersonByDocumento({ tipoDocumento, numeroDocumento }) {
  const personId = await getPersonIdByDocumento(tipoDocumento, numeroDocumento);
  if (!personId) {
    return null;
  }
  await cleanupPersonById(personId);
  return personId;
}

export async function cleanupPersonById(personId) {
  if (!personId) {
    return;
  }

  await db.execute('DELETE FROM registros_ingreso WHERE id_persona = ?', [personId]);
  await db.execute('DELETE FROM historial_visitas WHERE id_persona = ?', [personId]);
  await db.execute('DELETE FROM persona_transporte WHERE id_persona = ?', [personId]);
  await db.execute('DELETE FROM persona_participacion WHERE id_persona = ?', [personId]);
  await db.execute('DELETE FROM vehiculos WHERE id_conductor = ?', [personId]);
  await db.execute('DELETE FROM personas WHERE id_persona = ?', [personId]);
}

export async function getParticipacionByDocumento(tipoDocumento, numeroDocumento, eventoId, tipoParticipacion) {
  const [rows] = await db.execute(
    `SELECT pp.id_participacion AS id, pp.id_evento AS evento_id, pp.tipo_participacion, pp.estado
     FROM persona_participacion pp
     INNER JOIN personas p ON p.id_persona = pp.id_persona
     WHERE p.tipo_documento = ? AND p.numero_documento = ? AND pp.id_evento <=> ? AND pp.tipo_participacion = ?
     LIMIT 1`,
    [tipoDocumento, numeroDocumento, eventoId || null, tipoParticipacion]
  );
  return rows[0] || null;
}

export async function createEventFixture({ nombre, codigo_evento, fecha, hora_inicio = '09:00:00', hora_termino = '18:00:00', estado = 'ACTIVO', creadoPor = 1, unitIds = [] }) {
  const [result] = await db.execute(
    `INSERT INTO eventos (nombre, codigo_evento, fecha_inicio, fecha_termino, hora_inicio, hora_termino, estado, creado_por)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [nombre, codigo_evento, fecha, fecha, hora_inicio, hora_termino, estado, creadoPor]
  );

  const eventId = result.insertId;
  if (unitIds.length) {
    const rows = unitIds.map((unitId) => [eventId, unitId]);
    await db.query('INSERT INTO evento_unidades (id_evento, id_unidad) VALUES ?', [rows]);
  }

  return eventId;
}

export async function cleanupEventById(eventId) {
  if (!eventId) {
    return;
  }
  await deleteEvento(eventId);
}
