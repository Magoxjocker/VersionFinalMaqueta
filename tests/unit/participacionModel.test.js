import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createPerson } from '../../src/models/personaModel.js';
import {
  createParticipacion,
  findParticipacion,
  updateParticipacion,
} from '../../src/models/participacionModel.js';
import {
  cleanupPersonById,
  getPersonIdByDocumento,
  uniqueDocumento,
  createEventFixture,
  cleanupEventById,
} from '../helpers/dbTestUtils.js';
import db from '../../src/config/database.js';

let eventoId;

before(async () => {
  eventoId = await createEventFixture({
    nombre: 'Evento unit participacion',
    codigo_evento: 'UT-T-01',
    fecha: '2026-06-23',
    estado: 'ACTIVO',
    unitIds: [2],
  });
});

after(async () => {
  await cleanupEventById(eventoId);
  await db.end();
});

test('participacionModel crea, busca y actualiza una participacion', async () => {
  const numeroDocumento = uniqueDocumento('T');
  const tipoDocumento = 'EXTRANJERO';

  try {
    const personId = await createPerson({
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumento,
      nombre_completo: 'Participacion Test',
      correo: null,
      telefono: null,
    });

    const participacionId = await createParticipacion({
      personaId: personId,
      eventoId,
      unidadId: 2,
      tipoParticipacion: 'EVENTO',
      glosa: 'Registro inicial',
      registradoPor: 1,
    });

    const found = await findParticipacion(personId, eventoId, 'EVENTO');
    assert.equal(found.id, participacionId);
    assert.equal(found.estado, 'PENDIENTE');

    await updateParticipacion(participacionId, {
      eventoId,
      unidadId: 2,
      tipoParticipacion: 'EVENTO',
      glosa: 'Registro actualizado',
      estado: 'INGRESADO',
    });

    const updated = await findParticipacion(personId, eventoId, 'EVENTO');
    assert.equal(updated.estado, 'INGRESADO');
    assert.equal(updated.glosa_visita, 'Registro actualizado');
  } finally {
    await cleanupPersonById(await getPersonIdByDocumento(tipoDocumento, numeroDocumento));
  }
});
