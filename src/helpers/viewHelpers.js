export function formatDate(value) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatTime(value) {
  if (!value) return '-';
  return String(value).slice(0, 5);
}

export function formatDateTime(value) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function stateClass(state) {
  const value = String(state || '').toUpperCase();
  if (['ACTIVO', 'ACTIVA', 'PROGRAMADO', 'PROGRAMADA', 'REGISTRADO', 'INGRESO_REGISTRADO', 'INGRESADO', 'DISPONIBLE'].includes(value)) {
    return 'state-ok';
  }
  if (['PENDIENTE', 'EN_PROCESO', 'SIN_ASIGNAR', 'ASIGNADO'].includes(value)) {
    return 'state-pending';
  }
  if (['OCUPADO', 'FINALIZADO', 'INACTIVO', 'INACTIVA'].includes(value)) {
    return 'state-fail';
  }
  return 'state-fail';
}

export function normalizeText(value) {
  return String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function normalizeRole(role) {
  return normalizeText(role);
}

export function getCanonicalRole(role) {
  const normalized = normalizeRole(role);
  if (!normalized) return null;
  if (normalized === 'admin' || normalized === 'administrador') return 'Administrador';
  if (normalized === 'encargado') return 'Encargado';
  if (normalized === 'guardia') return 'Guardia';
  return null;
}

export function getRolePath(role) {
  const canonical = getCanonicalRole(role);
  if (canonical === 'Administrador') return '/admin';
  if (canonical === 'Encargado') return '/encargado';
  if (canonical === 'Guardia') return '/guardia';
  return '/';
}

export function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
