import db from '../config/database.js';

export async function findUserByEmail(correo) {
  const [rows] = await db.execute(
    `SELECT u.id_usuario AS id, u.nombre, u.correo, u.password_hash AS clave, u.estado,
      r.nombre AS rol, u.id_unidad AS unidad_id, un.nombre AS unidad_nombre
    FROM usuarios u
    LEFT JOIN roles r ON u.id_rol = r.id_rol
    LEFT JOIN unidades un ON u.id_unidad = un.id_unidad
    WHERE u.correo = ?
    LIMIT 1`,
    [correo]
  );
  return rows[0] || null;
}

export async function findUserById(id) {
  const [rows] = await db.execute(
    `SELECT u.id_usuario AS id, u.nombre, u.correo, u.id_rol AS rol_id, u.id_unidad AS unidad_id,
      u.estado, r.nombre AS rol, un.nombre AS unidad_nombre
    FROM usuarios u
    LEFT JOIN roles r ON u.id_rol = r.id_rol
    LEFT JOIN unidades un ON u.id_unidad = un.id_unidad
    WHERE u.id_usuario = ?
    LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function listUsers() {
  const [rows] = await db.execute(
    `SELECT u.id_usuario AS id, u.nombre, u.correo, u.estado, r.id_rol AS rol_id, r.nombre AS rol,
      un.id_unidad AS unidad_id, un.nombre AS unidad
    FROM usuarios u
    LEFT JOIN roles r ON u.id_rol = r.id_rol
    LEFT JOIN unidades un ON u.id_unidad = un.id_unidad
    ORDER BY u.nombre ASC`
  );
  return rows;
}

export async function createUser({ nombre, correo, claveHash, rolId, unidadId, estado = 'ACTIVO' }) {
  const [result] = await db.execute(
    'INSERT INTO usuarios (nombre, correo, password_hash, id_rol, id_unidad, estado) VALUES (?, ?, ?, ?, ?, ?)',
    [nombre, correo, claveHash, rolId, unidadId || null, estado]
  );
  return result.insertId;
}

export async function updateUser(id, { nombre, correo, claveHash, rolId, unidadId, estado }) {
  if (claveHash) {
    await db.execute(
      'UPDATE usuarios SET nombre = ?, correo = ?, password_hash = ?, id_rol = ?, id_unidad = ?, estado = ? WHERE id_usuario = ?',
      [nombre, correo, claveHash, rolId, unidadId || null, estado, id]
    );
    return;
  }
  await db.execute(
    'UPDATE usuarios SET nombre = ?, correo = ?, id_rol = ?, id_unidad = ?, estado = ? WHERE id_usuario = ?',
    [nombre, correo, rolId, unidadId || null, estado, id]
  );
}

export async function deleteUser(id) {
  await db.execute('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
}
