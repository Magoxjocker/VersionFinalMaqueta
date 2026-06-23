import express from 'express';
import { body } from 'express-validator';
import { ensureRole } from '../middlewares/authMiddleware.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import {
  adminDashboard,
  listUsersPage,
  saveUser,
  deleteUser,
  listUnidadesPage,
  saveUnidad,
  deleteUnidad,
  listEventosPage,
  saveEvento,
  deleteEvento,
  finalizeEvento,
  listEstacionamientosPage,
  saveParkingSpace,
  deleteParkingSpaceAction,
  historialesPage,
} from '../controllers/adminController.js';

const router = express.Router();

router.use(ensureRole('Administrador'));

router.get('/', adminDashboard);

router.get('/usuarios', listUsersPage);
router.post(
  '/usuarios',
  [
    body('nombre').trim().notEmpty().withMessage('Nombre obligatorio.'),
    body('correo').trim().isEmail().withMessage('Correo invalido.'),
    body('rol_id').isInt({ min: 1 }).withMessage('Rol invalido.'),
    body('estado').optional().isIn(['ACTIVO', 'INACTIVO']).withMessage('Estado invalido.'),
  ],
  validateRequest,
  saveUser
);
router.post('/usuarios/:id/eliminar', deleteUser);

router.get('/unidades', listUnidadesPage);
router.post(
  '/unidades',
  [
    body('nombre').trim().notEmpty().withMessage('Nombre obligatorio.'),
    body('estado').optional().isIn(['ACTIVA', 'INACTIVA']).withMessage('Estado invalido.'),
  ],
  validateRequest,
  saveUnidad
);
router.post('/unidades/:id/eliminar', deleteUnidad);

router.get('/eventos', listEventosPage);
router.post(
  '/eventos',
  [
    body('nombre').trim().notEmpty().withMessage('Nombre obligatorio.'),
    body('codigo_evento').trim().notEmpty().withMessage('Codigo obligatorio.'),
    body('fecha_inicio').isISO8601().withMessage('Fecha de inicio invalida.'),
    body('fecha_termino').isISO8601().withMessage('Fecha de termino invalida.'),
    body('hora_inicio').trim().notEmpty().withMessage('Hora de inicio obligatoria.'),
    body('hora_termino').trim().notEmpty().withMessage('Hora de termino obligatoria.'),
    body('estado').optional().isIn(['PROGRAMADO', 'ACTIVO', 'FINALIZADO']).withMessage('Estado invalido.'),
  ],
  validateRequest,
  saveEvento
);
router.post('/eventos/:id/finalizar', finalizeEvento);
router.post('/eventos/:id/eliminar', deleteEvento);

router.get('/estacionamientos', listEstacionamientosPage);
router.post(
  '/estacionamientos',
  [
    body('evento_id').isInt({ min: 1 }).withMessage('Evento invalido.'),
    body('cantidad_espacios').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Cantidad de espacios invalida.'),
    body('numero_espacio').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Numero de espacio invalido.'),
    body('unidad_id').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Unidad invalida.'),
  ],
  validateRequest,
  saveParkingSpace
);
router.post('/estacionamientos/:id/eliminar', deleteParkingSpaceAction);

router.get('/historiales', historialesPage);

export default router;
