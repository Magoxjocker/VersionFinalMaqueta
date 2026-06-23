import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createPerson,
  findPersonByDocumento,
  listPeopleByEvent,
  listDailyVisitors,
} from '../../src/models/personaModel.js';
import { createParticipacion } from '../../src/models/participacionModel.js';
import {
  cleanupPersonById,
  getPersonIdByDocumento,
  uniqueDocumento,
  createEventFixture,
  cleanupEventById,
} from '../helpers/dbTestUtils.js';
import db from '../../src/config/database.js';

let eventId;
let diariaEventId;

before(async () => {
  eventId = await createEventFixture({
    nombre: 'Evento unit persona',
    codigo_evento: 'UT-P-01',
    fecha: '2026-06-23',
    estado: 'ACTIVO',
    unitIds: [2],
  });
  diariaEventId = await createEventFixture({
    nombre: 'Evento diaria unit persona',
    codigo_evento: 'UT-P-02',
    fecha: '2026-06-23',
    estado: 'ACTIVO',
    unitIds: [2],
  });
});

after(async () => {
  await cleanupEventById(eventId);
  await cleanupEventById(diariaEventId);
  await db.end();
});

test('personaModel crea y busca una persona por documento', async () => {
  const numeroDocumento = uniqueDocumento('P');
  const tipoDocumento = 'CEDULA';

  try {
    const id = await createPerson({
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumento,
      nombre_completo: 'Persona Test',
      correo: 'persona.test@example.com',
      telefono: '912345678',
    });

    const found = await findPersonByDocumento(tipoDocumento, numeroDocumento);
    assert.equal(found.id, id);
    assert.equal(found.nombre_completo, 'Persona Test');
  } finally {
    await cleanupPersonById(await getPersonIdByDocumento(tipoDocumento, numeroDocumento));
  }
});

test('personaModel lista participaciones por evento y por visita diaria', async () => {
  const numeroDocumentoEvento = uniqueDocumento('E');
  const numeroDocumentoDiaria = uniqueDocumento('D');
  const tipoDocumento = 'PASAPORTE';

  try {
    const personEventoId = await createPerson({
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumentoEvento,
      nombre_completo: 'Persona Evento',
      correo: null,
      telefono: null,
    });
    const personDiariaId = await createPerson({
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumentoDiaria,
      nombre_completo: 'Persona Diaria',
      correo: null,
      telefono: null,
    });

    await createParticipacion({
      personaId: personEventoId,
      eventoId: eventId,
      unidadId: 2,
      tipoParticipacion: 'EVENTO',
      glosa: null,
      registradoPor: 1,
    });

    await createParticipacion({
      personaId: personDiariaId,
      eventoId: null,
      unidadId: 2,
      tipoParticipacion: 'VISITA_DIARIA',
      glosa: 'Visita diaria',
      registradoPor: 1,
    });

    const eventoRows = await listPeopleByEvent(eventId, '', 2);
    const diariaRows = await listDailyVisitors('', 2);

    assert.ok(eventoRows.some((row) => row.numero_documento === numeroDocumentoEvento));
    assert.ok(diariaRows.some((row) => row.numero_documento === numeroDocumentoDiaria));
  } finally {
    await cleanupPersonById(await getPersonIdByDocumento(tipoDocumento, numeroDocumentoEvento));
    await cleanupPersonById(await getPersonIdByDocumento(tipoDocumento, numeroDocumentoDiaria));
  }
});
