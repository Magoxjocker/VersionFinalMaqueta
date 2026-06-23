import db from '../config/database.js';

export async function listRoles() {
  const [rows] = await db.execute('SELECT id_rol AS id, nombre FROM roles ORDER BY id_rol ASC');
  return rows;
}

export async function findRoleById(id) {
  const [rows] = await db.execute('SELECT id_rol AS id, nombre FROM roles WHERE id_rol = ? LIMIT 1', [id]);
  return rows[0] || null;
}

export async function findRoleByName(nombre) {
  const [rows] = await db.execute('SELECT id_rol AS id, nombre FROM roles WHERE nombre = ? LIMIT 1', [nombre]);
  return rows[0] || null;
}
