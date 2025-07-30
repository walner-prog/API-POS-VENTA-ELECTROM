import { Router } from 'express';
import { crearVenta, cancelarVenta,obtenerDetalleVentaPorId,listarVentasDelDia,obtenerTotalesVentasPorCajaController } from '../controllers/venta.controller.js';
import authMiddleware from '../middlewares/auth.js'
const router = Router();

router.post('/', authMiddleware, crearVenta);
router.get('/:id', authMiddleware,  obtenerDetalleVentaPorId);
router.post('/cancelar/:id', authMiddleware, cancelarVenta);
router.get('/del-dia/ventas', authMiddleware, listarVentasDelDia);
router.get('/ventas/totales/:caja_id', obtenerTotalesVentasPorCajaController);

export default router;
