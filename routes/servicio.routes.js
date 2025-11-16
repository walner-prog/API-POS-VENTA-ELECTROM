// routes/servicio.routes.js
import { Router } from 'express';
import * as servicioCtrl from '../controllers/servicio.controller.js';
import authMiddleware from '../middlewares/auth.js';

const router = Router();

router.post('/', servicioCtrl.crearServicio);
router.get('/', servicioCtrl.listarServicios);
router.delete('/:id', servicioCtrl.eliminarServicio);

export default router;
