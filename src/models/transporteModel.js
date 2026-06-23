import db from '../config/database.js';

export async function upsertTransporte({ personaId, vehiculoId, tipoLlegada, conductorId = null, documentoConductor = null }) {
  const existing = await findTransporteByPersonaId(personaId);
  if (existing) {
    await db.execute(
      'UPDATE persona_transporte SET id_vehiculo = ?, tipo_llegada = ? WHERE id_persona = ?',
      [vehiculoId || null, tipoLlegada, personaId]
    );
    return existing.id_transporte;
  }

  const [result] = await db.execute(
    'INSERT INTO persona_transporte (id_persona, tipo_llegada, id_vehiculo) VALUES (?, ?, ?)',
    [personaId, tipoLlegada, vehiculoId || null]
  );
  return result.insertId;
}

export async function findTransporteByPersonaId(personaId) {
  const [rows] = await db.execute(
    `SELECT pt.id_transporte, pt.id_persona, pt.id_vehiculo, pt.tipo_llegada,
      v.patente, v.marca, v.modelo, v.color
    FROM persona_transporte pt
    LEFT JOIN vehiculos v ON v.id_vehiculo = pt.id_vehiculo
    WHERE pt.id_persona = ?
    LIMIT 1`,
    [personaId]
  );
  return rows[0] || null;
}
