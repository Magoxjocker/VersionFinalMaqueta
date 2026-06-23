import db from '../config/database.js';

export async function findVehiculoByPatente(patente) {
  const [rows] = await db.execute(
    `SELECT v.id_vehiculo AS id, v.id_conductor, v.patente, v.marca, v.modelo, v.color, v.observacion,
      p.nombre_completo AS conductor_nombre, p.numero_documento AS conductor_documento
    FROM vehiculos v
    LEFT JOIN personas p ON p.id_persona = v.id_conductor
    WHERE v.patente = ?
    LIMIT 1`,
    [patente]
  );
  return rows[0] || null;
}

export async function findVehiculoById(id) {
  const [rows] = await db.execute(
    `SELECT v.id_vehiculo AS id, v.id_conductor, v.patente, v.marca, v.modelo, v.color, v.observacion,
      p.nombre_completo AS conductor_nombre, p.numero_documento AS conductor_documento
    FROM vehiculos v
    LEFT JOIN personas p ON p.id_persona = v.id_conductor
    WHERE v.id_vehiculo = ?
    LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function createVehiculo({ patente, marca, modelo, color, conductorId, observacion }) {
  const [result] = await db.execute(
    'INSERT INTO vehiculos (id_conductor, patente, marca, modelo, color, observacion) VALUES (?, ?, ?, ?, ?, ?)',
    [conductorId || null, patente, marca || null, modelo || null, color || null, observacion || null]
  );
  return result.insertId;
}

export async function updateVehiculo(id, { patente, marca, modelo, color, conductorId, observacion }) {
  await db.execute(
    'UPDATE vehiculos SET id_conductor = ?, patente = ?, marca = ?, modelo = ?, color = ?, observacion = ? WHERE id_vehiculo = ?',
    [conductorId || null, patente, marca || null, modelo || null, color || null, observacion || null, id]
  );
}

export async function findOrCreateVehiculo({ patente, marca, modelo, color, conductorId, observacion }) {
  const existing = await findVehiculoByPatente(patente);
  if (existing) {
    await updateVehiculo(existing.id, {
      patente,
      marca,
      modelo,
      color,
      conductorId: existing.id_conductor || conductorId,
      observacion,
    });
    return existing.id;
  }

  return createVehiculo({ patente, marca, modelo, color, conductorId, observacion });
}
