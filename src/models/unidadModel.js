import db from '../config/database.js';

export async function listUnidades() {
  const [rows] = await db.execute('SELECT id_unidad AS id, nombre, descripcion, estado FROM unidades ORDER BY nombre ASC');
  return rows;
}

export async function findUnidadById(id) {
  const [rows] = await db.execute(
    'SELECT id_unidad AS id, nombre, descripcion, estado FROM unidades WHERE id_unidad = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

export async function createUnidad({ nombre, descripcion, estado = 'ACTIVA' }) {
  const [result] = await db.execute(
    'INSERT INTO unidades (nombre, descripcion, estado) VALUES (?, ?, ?)',
    [nombre, descripcion || null, estado]
  );
  return result.insertId;
}

export async function updateUnidad(id, { nombre, descripcion, estado }) {
  await db.execute(
    'UPDATE unidades SET nombre = ?, descripcion = ?, estado = ? WHERE id_unidad = ?',
    [nombre, descripcion || null, estado, id]
  );
}

export async function deleteUnidad(id) {
  await db.execute('DELETE FROM unidades WHERE id_unidad = ?', [id]);
}
