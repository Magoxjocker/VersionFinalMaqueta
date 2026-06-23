import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import db from '../../src/config/database.js';
import { startAppServer, loginAndGetCookie, httpGet, httpPostForm } from '../helpers/httpHarness.js';
import {
  cleanupPersonByDocumento,
  uniqueDocumento,
  createEventFixture,
  cleanupEventById,
} from '../helpers/dbTestUtils.js';

const port = 3011;
const tipoPrincipal = 'CEDULA';
const tipoPasajero = 'PASAPORTE';
const principalDocumento = uniqueDocumento('X');
const pasajeroDocumento = uniqueDocumento('Y');
let mainEventId;
let passengerEventId;
let app;

before(async () => {
  app = await startAppServer({ port });
  mainEventId = await createEventFixture({
    nombre: 'Evento e2e principal',
    codigo_evento: 'E2E-01',
    fecha: '2026-06-23',
    estado: 'ACTIVO',
    unitIds: [2],
  });
  passengerEventId = await createEventFixture({
    nombre: 'Evento e2e pasajero',
    codigo_evento: 'E2E-02',
    fecha: '2026-06-23',
    estado: 'ACTIVO',
    unitIds: [2],
  });
});

after(async () => {
  await cleanupPersonByDocumento({ tipoDocumento: tipoPrincipal, numeroDocumento: principalDocumento });
  await cleanupPersonByDocumento({ tipoDocumento: tipoPasajero, numeroDocumento: pasajeroDocumento });
  await cleanupEventById(mainEventId);
  await cleanupEventById(passengerEventId);
  await app.stop();
  await db.end();
});

test('flujo completo encargado -> guardia -> ingreso', async () => {
  const encargado = await loginAndGetCookie(app.baseUrl, 'informatica@sistema.cl', 'encargado123');
  const guardia = await loginAndGetCookie(app.baseUrl, 'guardia@sistema.cl', 'guardia123');

  const panelEncargado = await httpGet(app.baseUrl, `/encargado?scope=evento&evento_id=${mainEventId}`, encargado.cookieHeader);
  assert.equal(panelEncargado.status, 200);

  const registro = await httpPostForm(app.baseUrl, '/encargado/personas', {
    scope: 'evento',
    evento_id: String(mainEventId),
    tipo_documento: tipoPrincipal,
    numero_documento: principalDocumento,
    nombre_completo: 'E2E Principal',
    correo: 'e2e.principal@example.com',
    telefono: '900000001',
    tipo_llegada: 'VEHICULO_PROPIO',
    patente: 'E2E123',
    marca: 'Toyota',
    modelo: 'Yaris',
    color: 'Blanco',
    requiere_estacionamiento: '0',
    con_pasajero: 'on',
    tipo_documento_pasajero: tipoPasajero,
    numero_documento_pasajero: pasajeroDocumento,
    nombre_completo_pasajero: 'E2E Pasajero',
    evento_id_pasajero: String(passengerEventId),
  }, encargado.cookieHeader);

  assert.equal(registro.status, 302);

  const [personaRows] = await db.execute(
    'SELECT id_persona AS id FROM personas WHERE numero_documento = ? LIMIT 1',
    [principalDocumento]
  );
  assert.ok(personaRows[0]?.id);

  const ingreso = await httpPostForm(app.baseUrl, '/guardia/ingresos', {
    persona_id: String(personaRows[0].id),
    evento_id: String(mainEventId),
    tipo_participacion: 'EVENTO',
    scope: 'evento',
  }, guardia.cookieHeader);

  assert.equal(ingreso.status, 302);

  const [ingresoRows] = await db.execute(
    `SELECT ri.id_registro
     FROM registros_ingreso ri
     INNER JOIN personas p ON p.id_persona = ri.id_persona
     WHERE p.numero_documento = ?`,
    [principalDocumento]
  );
  assert.equal(ingresoRows.length, 1);
});
