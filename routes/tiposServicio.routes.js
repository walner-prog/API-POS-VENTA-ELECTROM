// routes/tiposServicio.routes.js
import { Router } from 'express';
import * as tiposCtrl from '../controllers/tiposServicio.controller.js';
import authMiddleware from '../middlewares/auth.js'; // si usas auth

const router = Router();

router.post('/', tiposCtrl.crearTipo);
router.get('/', tiposCtrl.listarTipos);
router.delete('/:id', tiposCtrl.eliminarTipo);

export default router;
