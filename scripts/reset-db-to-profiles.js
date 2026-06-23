import db from '../src/config/database.js';

const tablesToClear = [
  'registros_ingreso',
  'historial_visitas',
  'historial_eventos',
  'persona_transporte',
  'persona_participacion',
  'evento_estacionamientos',
  'evento_unidades',
  'vehiculos',
  'personas',
  'cierres_diarios',
  'eventos',
];

const tablesToReset = [...tablesToClear];
const canonicalRoles = ['Administrador', 'Encargado', 'Guardia'];
const canonicalUnits = [
  ['Direccion', 'Zona central y coordinacion general', 'ACTIVA'],
  ['Informatica', 'Soporte, sistemas y redes', 'ACTIVA'],
  ['Seguridad', 'Control de acceso y vigilancia', 'ACTIVA'],
];
const canonicalUsers = [
  ['Admin General', 'admin@sistema.cl', '$2b$10$U3MB4ASgoGRKN7CmpZA6oOinUbdKNQXTdBZz/fOJYZTwZs92r9xaq', 'Administrador', 'Direccion', 'ACTIVO'],
  ['Encargado Informatica', 'informatica@sistema.cl', '$2b$10$dAqgFcmcyrmcgF/.1YjuaeUA6FZIS8lN8xBg1U4W3KpMBEsY4Bn.G', 'Encargado', 'Informatica', 'ACTIVO'],
  ['Guardia Principal', 'guardia@sistema.cl', '$2b$10$9sI4bQqILLsFGtxoRS82buVDiA7g2Ukq5HW7det4PSQHUuXmB2gUe', 'Guardia', 'Seguridad', 'ACTIVO'],
];

async function main() {
  try {
    for (const table of tablesToClear) {
      await db.execute(`DELETE FROM ${table}`);
    }

    for (const table of tablesToReset) {
      try {
        await db.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
      } catch {
        // Algunas tablas no exponen AUTO_INCREMENT; se ignora.
      }
    }

    for (const nombre of canonicalRoles) {
      await db.execute('INSERT IGNORE INTO roles (nombre) VALUES (?)', [nombre]);
    }

    for (const [nombre, descripcion, estado] of canonicalUnits) {
      await db.execute(
        'INSERT IGNORE INTO unidades (nombre, descripcion, estado) VALUES (?, ?, ?)',
        [nombre, descripcion, estado]
      );
    }

    await db.execute(
      `DELETE FROM usuarios
       WHERE correo NOT IN ('admin@sistema.cl', 'informatica@sistema.cl', 'guardia@sistema.cl')`
    );

    const [roleRows] = await db.execute(
      `SELECT id_rol AS id, nombre FROM roles WHERE nombre IN ('Administrador', 'Encargado', 'Guardia')`
    );
    const roleMap = new Map(roleRows.map((row) => [row.nombre, row.id]));

    const [unitRows] = await db.execute(
      `SELECT id_unidad AS id, nombre FROM unidades WHERE nombre IN ('Direccion', 'Informatica', 'Seguridad')`
    );
    const unitMap = new Map(unitRows.map((row) => [row.nombre, row.id]));

    for (const user of canonicalUsers) {
      const [nombre, correo, passwordHash, roleName, unitName, estado] = user;
      await db.execute(
        `INSERT INTO usuarios (nombre, correo, password_hash, id_rol, id_unidad, estado)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           nombre = VALUES(nombre),
           password_hash = VALUES(password_hash),
           id_rol = VALUES(id_rol),
           id_unidad = VALUES(id_unidad),
           estado = VALUES(estado)`,
        [nombre, correo, passwordHash, roleMap.get(roleName), unitMap.get(unitName), estado]
      );
    }

    await db.execute(
      `DELETE FROM unidades
       WHERE nombre NOT IN ('Direccion', 'Informatica', 'Seguridad')`
    );

    const [counts] = await db.execute(`
      SELECT 'roles' AS tabla, COUNT(*) AS total FROM roles
      UNION ALL SELECT 'unidades', COUNT(*) FROM unidades
      UNION ALL SELECT 'usuarios', COUNT(*) FROM usuarios
      UNION ALL SELECT 'eventos', COUNT(*) FROM eventos
      UNION ALL SELECT 'personas', COUNT(*) FROM personas
      UNION ALL SELECT 'persona_participacion', COUNT(*) FROM persona_participacion
      UNION ALL SELECT 'registros_ingreso', COUNT(*) FROM registros_ingreso
      UNION ALL SELECT 'historial_visitas', COUNT(*) FROM historial_visitas
      UNION ALL SELECT 'historial_eventos', COUNT(*) FROM historial_eventos
      UNION ALL SELECT 'persona_transporte', COUNT(*) FROM persona_transporte
      UNION ALL SELECT 'evento_unidades', COUNT(*) FROM evento_unidades
      UNION ALL SELECT 'evento_estacionamientos', COUNT(*) FROM evento_estacionamientos
      UNION ALL SELECT 'vehiculos', COUNT(*) FROM vehiculos
      UNION ALL SELECT 'cierres_diarios', COUNT(*) FROM cierres_diarios
    `);

    console.log(JSON.stringify(counts, null, 2));
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
