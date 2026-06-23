import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createPerson } from '../../src/models/personaModel.js';
import { createParticipacion } from '../../src/models/participacionModel.js';
import { createIngreso, findIngresoByParticipacionId } from '../../src/models/ingresoModel.js';
import {
  cleanupPersonById,
  getPersonIdByDocumento,
  uniqueDocumento,
  createEventFixture,
  cleanupEventById,
} from '../helpers/dbTestUtils.js';
import db from '../../src/config/database.js';

let eventId;

before(async () => {
  eventId = await createEventFixture({
    nombre: 'Evento unit ingreso',
    codigo_evento: 'UT-I-01',
    fecha: '2026-06-23',
    estado: 'ACTIVO',
    unitIds: [2],
  });
});

after(async () => {
  await cleanupEventById(eventId);
  await db.end();
});

test('ingresoModel crea un ingreso y lo puede recuperar por participacion', async () => {
  const numeroDocumento = uniqueDocumento('I');
  const tipoDocumento = 'CEDULA';

  try {
    const personId = await createPerson({
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumento,
      nombre_completo: 'Ingreso Test',
      correo: null,
      telefono: null,
    });

    const participacionId = await createParticipacion({
      personaId: personId,
      eventoId: eventId,
      unidadId: 2,
      tipoParticipacion: 'EVENTO',
      glosa: null,
      registradoPor: 1,
    });

    const ingresoId = await createIngreso({
      personaId: personId,
      participacionId,
      usuarioGuardiaId: 3,
      eventoId: eventId,
      tipoParticipacion: 'EVENTO',
      vehiculoId: null,
    });

    const found = await findIngresoByParticipacionId(participacionId);
    assert.equal(found.id, ingresoId);
    assert.equal(found.id_participacion, participacionId);
    assert.equal(found.estado, 'INGRESADO');
  } finally {
    await cleanupPersonById(await getPersonIdByDocumento(tipoDocumento, numeroDocumento));
  }
});
