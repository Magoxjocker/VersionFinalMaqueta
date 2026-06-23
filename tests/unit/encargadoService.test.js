import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEncargadoRegistration,
  buildMainParticipation,
  buildPassengerParticipation,
  normalizeScope,
  normalizeTipoDocumento,
  isTruthy,
} from '../../src/services/encargadoService.js';

test('encargadoService normaliza scope y documentos', () => {
  assert.equal(normalizeScope('evento'), 'evento');
  assert.equal(normalizeScope('diaria'), 'diaria');
  assert.equal(normalizeScope('x'), 'diaria');
  assert.equal(normalizeTipoDocumento('rut'), 'CEDULA');
  assert.equal(normalizeTipoDocumento('pasaporte'), 'PASAPORTE');
  assert.equal(normalizeTipoDocumento('extranjero'), 'EXTRANJERO');
  assert.equal(normalizeTipoDocumento('otro'), null);
  assert.equal(isTruthy('on'), true);
  assert.equal(isTruthy('si'), true);
  assert.equal(isTruthy('false'), false);
});

test('buildEncargadoRegistration valida la seleccion principal y pasajero', () => {
  const plan = buildEncargadoRegistration({
    scope: 'evento',
    evento_id: '2',
    tipo_documento: 'RUT',
    con_pasajero: 'on',
    tipo_documento_pasajero: 'CEDULA',
    numero_documento_pasajero: '12345678-9',
    nombre_completo_pasajero: 'Pasajero Uno',
    evento_id_pasajero: '1',
    tipo_llegada: 'VEHICULO_PROPIO',
    patente: 'ABCD12',
  });

  assert.deepEqual(plan.errors, []);
  assert.equal(plan.selectedScope, 'evento');
  assert.equal(plan.eventoId, 2);
  assert.equal(plan.tipoDocumento, 'CEDULA');
  assert.equal(plan.passengerRequested, true);
  assert.equal(plan.passengerEventId, 1);
  assert.equal(plan.parkingRequested, false);
});

test('buildMainParticipation y buildPassengerParticipation usan eventos correctos', () => {
  assert.deepEqual(buildMainParticipation('evento', 8, 2, 99, 'Glosa'), {
    tipoParticipacion: 'EVENTO',
    eventoId: 8,
    unidadId: 2,
    registradoPor: 99,
    glosa: null,
  });

  assert.deepEqual(buildMainParticipation('diaria', null, 2, 99, 'Visita diaria'), {
    tipoParticipacion: 'VISITA_DIARIA',
    eventoId: null,
    unidadId: 2,
    registradoPor: 99,
    glosa: 'Visita diaria',
  });

  assert.deepEqual(buildPassengerParticipation(1, 2, 99), {
    tipoParticipacion: 'EVENTO',
    eventoId: 1,
    unidadId: 2,
    registradoPor: 99,
    glosa: 'Pasajero registrado por encargado',
  });
});
