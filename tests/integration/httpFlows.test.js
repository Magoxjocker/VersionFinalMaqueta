import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import db from '../../src/config/database.js';
import {
  startAppServer,
  loginAndGetCookie,
  httpGet,
  httpPostForm,
} from '../helpers/httpHarness.js';
import {
  cleanupPersonByDocumento,
  getParticipacionByDocumento,
  getPersonIdByDocumento,
  uniqueDocumento,
  createEventFixture,
  cleanupEventById,
} from '../helpers/dbTestUtils.js';

const serverPort = 3010;
const primaryDocumento = uniqueDocumento('P');
const passengerDocumento = uniqueDocumento('Q');
const primaryType = 'RUT';
const passengerType = 'CEDULA';
let mainEventId;
let passengerEventId;
let app;

before(async () => {
  app = await startAppServer({ port: serverPort });
  mainEventId = await createEventFixture({
    nombre: 'Evento integracion principal',
    codigo_evento: 'INT-01',
    fecha: '2026-06-23',
    estado: 'ACTIVO',
    unitIds: [2],
  });
  passengerEventId = await createEventFixture({
    nombre: 'Evento integracion pasajero',
    codigo_evento: 'INT-02',
    fecha: '2026-06-23',
    estado: 'ACTIVO',
    unitIds: [2],
  });
});

after(async () => {
  await cleanupPersonByDocumento({ tipoDocumento: 'CEDULA', numeroDocumento: primaryDocumento });
  await cleanupPersonByDocumento({ tipoDocumento: passengerType, numeroDocumento: passengerDocumento });
  await cleanupEventById(mainEventId);
  await cleanupEventById(passengerEventId);
  await app.stop();
  await db.end();
});

test('auth routes and protected dashboards respond correctly', async () => {
  const loginPage = await httpGet(app.baseUrl, '/login');
  assert.equal(loginPage.status, 200);

  const adminLogin = await loginAndGetCookie(app.baseUrl, 'admin@sistema.cl', 'admin123');
  assert.equal(adminLogin.response.status, 302);
  assert.match(adminLogin.response.headers.get('location') || '', /\/admin/);

  const adminPanel = await httpGet(app.baseUrl, '/admin', adminLogin.cookieHeader);
  assert.equal(adminPanel.status, 200);

  const encargadoLogin = await loginAndGetCookie(app.baseUrl, 'informatica@sistema.cl', 'encargado123');
  assert.equal(encargadoLogin.response.status, 302);
  assert.match(encargadoLogin.response.headers.get('location') || '', /\/encargado/);

  const guardiaLogin = await loginAndGetCookie(app.baseUrl, 'guardia@sistema.cl', 'guardia123');
  assert.equal(guardiaLogin.response.status, 302);
  assert.match(guardiaLogin.response.headers.get('location') || '', /\/guardia/);
});

test('encargado registra persona principal en una card y pasajero en otra actividad', async () => {
  const encargadoLogin = await loginAndGetCookie(app.baseUrl, 'informatica@sistema.cl', 'encargado123');

  await cleanupPersonByDocumento({ tipoDocumento: 'CEDULA', numeroDocumento: primaryDocumento });
  await cleanupPersonByDocumento({ tipoDocumento: passengerType, numeroDocumento: passengerDocumento });

  const response = await httpPostForm(app.baseUrl, '/encargado/personas', {
    scope: 'evento',
    evento_id: String(mainEventId),
    tipo_documento: primaryType,
    numero_documento: primaryDocumento,
    nombre_completo: 'Persona Principal Test',
    correo: 'principal.test@example.com',
    telefono: '912345678',
    tipo_llegada: 'A_PIE',
    requiere_estacionamiento: '0',
    con_pasajero: 'on',
    tipo_documento_pasajero: passengerType,
    numero_documento_pasajero: passengerDocumento,
    nombre_completo_pasajero: 'Pasajero Test',
    evento_id_pasajero: String(passengerEventId),
    glosa_visita: 'Registro de prueba',
  }, encargadoLogin.cookieHeader);

  assert.equal(response.status, 302);
  assert.match(response.headers.get('location') || '', new RegExp(`\\/encargado\\?scope=evento&evento_id=${mainEventId}`));

  const mainParticipation = await getParticipacionByDocumento('CEDULA', primaryDocumento, mainEventId, 'EVENTO');
  const passengerParticipation = await getParticipacionByDocumento(passengerType, passengerDocumento, passengerEventId, 'EVENTO');
  assert.ok(mainParticipation);
  assert.ok(passengerParticipation);

  const [mainRows] = await db.execute(
    `SELECT pp.id_evento
     FROM persona_participacion pp
     INNER JOIN personas p ON p.id_persona = pp.id_persona
     WHERE p.numero_documento = ?`,
    [primaryDocumento]
  );
  const [passengerRows] = await db.execute(
    `SELECT pp.id_evento
     FROM persona_participacion pp
     INNER JOIN personas p ON p.id_persona = pp.id_persona
     WHERE p.numero_documento = ?`,
    [passengerDocumento]
  );

  assert.deepEqual(mainRows.map((row) => Number(row.id_evento)), [mainEventId]);
  assert.deepEqual(passengerRows.map((row) => Number(row.id_evento)), [passengerEventId]);
});

test('guardia marca ingreso una sola vez para la misma participacion', async () => {
  const encargadoLogin = await loginAndGetCookie(app.baseUrl, 'informatica@sistema.cl', 'encargado123');
  const guardiaLogin = await loginAndGetCookie(app.baseUrl, 'guardia@sistema.cl', 'guardia123');

  await cleanupPersonByDocumento({ tipoDocumento: 'CEDULA', numeroDocumento: primaryDocumento });
  await httpPostForm(app.baseUrl, '/encargado/personas', {
    scope: 'evento',
    evento_id: String(mainEventId),
    tipo_documento: primaryType,
    numero_documento: primaryDocumento,
    nombre_completo: 'Ingreso Unico Test',
    correo: 'ingreso.unico@example.com',
    telefono: '912345678',
    tipo_llegada: 'A_PIE',
    requiere_estacionamiento: '0',
    con_pasajero: '0',
    glosa_visita: 'Ingreso para guardia',
  }, encargadoLogin.cookieHeader);

  const personId = await getPersonIdByDocumento('CEDULA', primaryDocumento);
  assert.ok(personId);

  const ingresoResponse = await httpPostForm(app.baseUrl, '/guardia/ingresos', {
    persona_id: String(personId),
    evento_id: String(mainEventId),
    tipo_participacion: 'EVENTO',
    scope: 'evento',
  }, guardiaLogin.cookieHeader);
  assert.equal(ingresoResponse.status, 302);

  const duplicateResponse = await httpPostForm(app.baseUrl, '/guardia/ingresos', {
    persona_id: String(personId),
    evento_id: String(mainEventId),
    tipo_participacion: 'EVENTO',
    scope: 'evento',
  }, guardiaLogin.cookieHeader);
  assert.equal(duplicateResponse.status, 302);

  const [rows] = await db.execute(
    `SELECT ri.id_registro
     FROM registros_ingreso ri
     INNER JOIN personas p ON p.id_persona = ri.id_persona
     WHERE p.numero_documento = ?`,
    [primaryDocumento]
  );
  assert.equal(rows.length, 1);
});
