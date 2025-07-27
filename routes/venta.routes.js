import { Router } from 'express';
import { crearVenta, cancelarVenta,obtenerDetalleVentaPorId } from '../controllers/venta.controller.js';
import authMiddleware from '../middlewares/auth.js'
const router = Router();

router.post('/', authMiddleware, crearVenta);
router.get('/ventas/:id', authMiddleware,  obtenerDetalleVentaPorId);
router.post('/cancelar/:id', authMiddleware, cancelarVenta);

export default router;
