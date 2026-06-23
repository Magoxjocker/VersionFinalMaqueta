import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDate,
  formatTime,
  formatDateTime,
  stateClass,
  normalizeText,
  getCanonicalRole,
  getRolePath,
} from '../../src/helpers/viewHelpers.js';

test('viewHelpers normaliza texto y roles', () => {
  assert.equal(normalizeText('  InforMática  '), 'informatica');
  assert.equal(getCanonicalRole('admin'), 'Administrador');
  assert.equal(getCanonicalRole('encargado'), 'Encargado');
  assert.equal(getCanonicalRole('guardia'), 'Guardia');
  assert.equal(getRolePath('Administrador'), '/admin');
  assert.equal(getRolePath('Encargado'), '/encargado');
  assert.equal(getRolePath('Guardia'), '/guardia');
});

test('viewHelpers formatea fecha, hora y estado', () => {
  assert.equal(formatDate('2026-06-23T15:00:00.000Z'), '23-06-2026');
  assert.equal(formatTime('09:45:00'), '09:45');
  assert.match(formatDateTime('2026-06-23T09:45:00.000Z'), /23-06-2026/);
  assert.equal(stateClass('ACTIVO'), 'state-ok');
  assert.equal(stateClass('PENDIENTE'), 'state-pending');
  assert.equal(stateClass('FINALIZADO'), 'state-fail');
});
