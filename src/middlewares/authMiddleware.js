import { getCanonicalRole } from '../helpers/viewHelpers.js';

export function ensureAuthenticated(req, res, next) {
  if (req.session.user && req.session.user.id) {
    return next();
  }
  req.session.error = 'Debe iniciar sesión para acceder a esta página.';
  return res.redirect('/');
}

export function ensureRole(role) {
  return (req, res, next) => {
    const currentRole = getCanonicalRole(req.session.user?.rol);
    const expectedRole = getCanonicalRole(role);

    if (!currentRole || currentRole !== expectedRole) {
      req.session.error = 'No tiene permiso para acceder a esta sección.';
      return res.redirect('/');
    }

    return next();
  };
}

export function ensureAnyRole(roles = []) {
  return (req, res, next) => {
    const currentRole = getCanonicalRole(req.session.user?.rol);
    const allowedRoles = roles.map((item) => getCanonicalRole(item)).filter(Boolean);

    if (!currentRole || !allowedRoles.includes(currentRole)) {
      req.session.error = 'No tiene permiso para acceder a esta sección.';
      return res.redirect('/');
    }

    return next();
  };
}
