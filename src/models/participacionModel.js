import db from '../config/database.js';

export async function createParticipacion({ personaId, eventoId, unidadId, tipoParticipacion, glosa, registradoPor, estado = 'PENDIENTE' }) {
  const [result] = await db.execute(
    `INSERT INTO persona_participacion (
      id_persona, id_unidad, tipo_participacion, id_evento, glosa_visita, fecha_registro, registrado_por, estado
    )
    VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)`,
    [personaId, unidadId || null, tipoParticipacion, eventoId || null, glosa || null, registradoPor || null, estado]
  );
  return result.insertId;
}

export async function findParticipacion(personaId, eventoId, tipoParticipacion) {
  const [rows] = await db.execute(
    `SELECT id_participacion AS id, id_persona, id_evento, id_unidad, tipo_participacion, glosa_visita, estado
    FROM persona_participacion
    WHERE id_persona = ? AND id_evento <=> ? AND tipo_participacion = ?
    LIMIT 1`,
    [personaId, eventoId || null, tipoParticipacion]
  );
  return rows[0] || null;
}

export async function updateParticipacion(id, { eventoId, unidadId, tipoParticipacion, glosa, estado }) {
  await db.execute(
    `UPDATE persona_participacion
    SET id_evento = ?, id_unidad = ?, tipo_participacion = ?, glosa_visita = ?, estado = ?
    WHERE id_participacion = ?`,
    [eventoId || null, unidadId || null, tipoParticipacion, glosa || null, estado || 'PENDIENTE', id]
  );
}

export async function updateParticipacionEstado(id, estado) {
  await db.execute('UPDATE persona_participacion SET estado = ? WHERE id_participacion = ?', [estado, id]);
}

export async function listParticipacionesByPersona(personaId) {
  const [rows] = await db.execute(
    `SELECT pp.id_participacion AS id, pp.id_evento AS evento_id, pp.id_unidad AS unidad_id,
      pp.tipo_participacion, pp.glosa_visita, pp.fecha_registro, pp.registrado_por, pp.estado,
      e.nombre AS evento_nombre, u.nombre AS unidad_nombre
    FROM persona_participacion pp
    LEFT JOIN eventos e ON e.id_evento = pp.id_evento
    LEFT JOIN unidades u ON u.id_unidad = pp.id_unidad
    WHERE pp.id_persona = ?
    ORDER BY pp.id_participacion DESC`,
    [personaId]
  );
  return rows;
}
