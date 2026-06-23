import express from 'express';
import { body } from 'express-validator';
import { ensureRole } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { encargadoDashboard, registrarPersona } from '../controllers/encargadoController.js';

const router = express.Router();

router.use(ensureRole('Encargado'));

router.get('/', encargadoDashboard);
router.post(
  '/personas',
  [
    body('tipo_documento').isIn(['CEDULA', 'PASAPORTE', 'EXTRANJERO', 'RUT']).withMessage('Tipo de documento invalido.'),
    body('numero_documento').trim().notEmpty().withMessage('Documento obligatorio.'),
    body('nombre_completo').trim().notEmpty().withMessage('Nombre obligatorio.'),
    body('scope').optional().isIn(['evento', 'diaria']).withMessage('Scope invalido.'),
    body('tipo_llegada').isIn(['A_PIE', 'VEHICULO_PROPIO', 'OTRO']).withMessage('Tipo de llegada invalido.'),
    body('evento_id_pasajero')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 })
      .withMessage('Evento del pasajero invalido.'),
  ],
  validateRequest,
  registrarPersona
);

export default router;
