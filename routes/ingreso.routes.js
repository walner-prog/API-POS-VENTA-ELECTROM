import express from 'express';
import {
  crearIngreso,
  actualizarIngreso,
  listarIngresosPorCaja,
  anularIngreso
} from '../controllers/ingreso.controller.js';

import authMiddleware from '../middlewares/auth.js';
import soloCreadorOAdmin from '../middlewares/soloCreadorOAdminEliminaEgreso.js';

const router = express.Router();

router.post('/', authMiddleware, crearIngreso);
router.put('/:id', authMiddleware, actualizarIngreso);
router.get('/caja/:caja_id', authMiddleware, listarIngresosPorCaja);
router.put('/anular/:ingreso_id', authMiddleware, anularIngreso);

export default router;
