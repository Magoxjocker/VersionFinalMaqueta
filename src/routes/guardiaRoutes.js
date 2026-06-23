import express from 'express';
import { body } from 'express-validator';
import { ensureRole } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { guardiaDashboard, registrarIngreso } from '../controllers/guardiaController.js';

const router = express.Router();

router.use(ensureRole('Guardia'));

router.get('/', guardiaDashboard);
router.post(
  '/ingresos',
  [
    body('persona_id').isInt({ min: 1 }).withMessage('Persona invalida.'),
    body('tipo_participacion').isIn(['EVENTO', 'VISITA_DIARIA']).withMessage('Tipo de participacion invalido.'),
    body('scope').optional().isIn(['evento', 'diaria']).withMessage('Scope invalido.'),
    body('evento_id').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Evento invalido.'),
  ],
  validateRequest,
  registrarIngreso
);

export default router;
