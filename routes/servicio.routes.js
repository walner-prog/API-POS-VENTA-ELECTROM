// routes/servicio.routes.js
import { Router } from 'express';
import * as servicioCtrl from '../controllers/servicio.controller.js';
import authMiddleware from '../middlewares/auth.js';

const router = Router();

router.post('/', authMiddleware, servicioCtrl.crearServicio);
router.get('/', authMiddleware, servicioCtrl.listarServicios);
router.delete('/:id', authMiddleware, servicioCtrl.eliminarServicio);

export default router;
