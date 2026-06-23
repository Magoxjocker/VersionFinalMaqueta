import bcrypt from 'bcrypt';
import { findUserByEmail } from '../models/userModel.js';
import { getCanonicalRole, getRolePath } from '../helpers/viewHelpers.js';

export function loginPage(req, res) {
  return res.render('auth/login', {
    title: 'Ingreso al sistema',
  });
}

export async function loginUser(req, res) {
  try {
    const { correo, clave } = req.body;
    const user = await findUserByEmail(correo);

    if (!user) {
      req.session.error = 'Correo o contraseña incorrectos.';
      return res.redirect('/');
    }

    const validPassword = await bcrypt.compare(clave, user.clave);
    if (!validPassword) {
      req.session.error = 'Correo o contraseña incorrectos.';
      return res.redirect('/');
    }

    if (String(user.estado || '').toUpperCase() !== 'ACTIVO') {
      req.session.error = 'El usuario no está activo.';
      return res.redirect('/');
    }

    const canonicalRole = getCanonicalRole(user.rol);
    if (!canonicalRole) {
      req.session.error = 'El rol del usuario no es válido para el sistema.';
      return res.redirect('/');
    }

    req.session.user = {
      id: user.id,
      nombre: user.nombre,
      correo: user.correo,
      rol: canonicalRole,
      rol_original: user.rol,
      unidad_id: user.unidad_id,
      unidad_nombre: user.unidad_nombre,
    };

    return res.redirect(getRolePath(canonicalRole));
  } catch (error) {
    console.error('[authController.loginUser]', {
      route: req.originalUrl,
      role: req.session.user?.rol || 'anonymous',
      message: error.message,
      stack: error.stack,
    });
    req.session.error = 'No fue posible iniciar sesión.';
    return res.redirect('/');
  }
}

export function logoutUser(req, res) {
  req.session.destroy(() => {
    res.redirect('/');
  });
}
