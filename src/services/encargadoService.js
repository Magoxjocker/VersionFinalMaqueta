export function normalizeTipoDocumento(value) {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized === 'CEDULA' || normalized === 'RUT') return 'CEDULA';
  if (normalized === 'PASAPORTE') return 'PASAPORTE';
  if (normalized === 'EXTRANJERO') return 'EXTRANJERO';
  return null;
}

export function normalizeScope(value) {
  return String(value || '').trim().toLowerCase() === 'evento' ? 'evento' : 'diaria';
}

export function isTruthy(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'on' || normalized === 'si';
}

export function buildEncargadoRegistration(input = {}) {
  const selectedScope = normalizeScope(input.scope || input.return_scope);
  const tipoDocumento = normalizeTipoDocumento(input.tipo_documento);
  const passengerTipoDocumento = normalizeTipoDocumento(input.tipo_documento_pasajero);
  const eventoId = selectedScope === 'evento' ? Number(input.evento_id) : null;
  const passengerRequested = isTruthy(input.con_pasajero);
  const passengerEventId = Number(input.evento_id_pasajero);
  const tipoLlegada = String(input.tipo_llegada || 'A_PIE').trim().toUpperCase();

  const errors = [];
  if (!tipoDocumento) errors.push('Tipo de documento invalido.');
  if (selectedScope === 'evento' && (!Number.isFinite(eventoId) || eventoId <= 0)) errors.push('Debe seleccionar un evento.');
  if (tipoLlegada === 'VEHICULO_PROPIO' && !String(input.patente || '').trim()) errors.push('Debe ingresar la patente del vehiculo.');
  if (passengerRequested) {
    if (
      !passengerTipoDocumento ||
      !String(input.numero_documento_pasajero || '').trim() ||
      !String(input.nombre_completo_pasajero || '').trim() ||
      !Number.isFinite(passengerEventId) ||
      passengerEventId <= 0
    ) {
      errors.push('Debe completar los datos del pasajero y su evento.');
    }
  }

  return {
    errors,
    selectedScope,
    eventoId: Number.isFinite(eventoId) && eventoId > 0 ? eventoId : null,
    tipoDocumento,
    tipoLlegada,
    passengerRequested,
    passengerTipoDocumento,
    passengerEventId: Number.isFinite(passengerEventId) && passengerEventId > 0 ? passengerEventId : null,
    parkingRequested: isTruthy(input.requiere_estacionamiento),
  };
}

export function buildMainParticipation(scope, eventoId, unidadId, userId, glosaVisita = null) {
  const tipoParticipacion = scope === 'evento' ? 'EVENTO' : 'VISITA_DIARIA';
  return {
    tipoParticipacion,
    eventoId: tipoParticipacion === 'EVENTO' ? eventoId : null,
    unidadId,
    registradoPor: userId,
    glosa: tipoParticipacion === 'VISITA_DIARIA' ? glosaVisita : null,
  };
}

export function buildPassengerParticipation(eventoId, unidadId, userId) {
  return {
    tipoParticipacion: 'EVENTO',
    eventoId,
    unidadId,
    registradoPor: userId,
    glosa: 'Pasajero registrado por encargado',
  };
}
