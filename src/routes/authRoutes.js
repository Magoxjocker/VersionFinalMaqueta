import express from 'express';
import { body } from 'express-validator';
import { loginPage, loginUser, logoutUser } from '../controllers/authController.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';

const router = express.Router();

router.get('/', loginPage);
router.get('/login', loginPage);
router.post(
  '/login',
  [
    body('correo').trim().isEmail().withMessage('Correo invalido.'),
    body('clave').trim().notEmpty().withMessage('La contrasena es obligatoria.'),
  ],
  validateRequest,
  loginUser
);
router.get('/logout', logoutUser);

export default router;
