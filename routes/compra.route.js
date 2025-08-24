import express from 'express';
import { registrarCompra, listarCompras, obtenerCompraPorId,eliminarCompra } from '../controllers/compra.controller.js';
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();

router.post('/', authMiddleware, registrarCompra);
router.get('/', authMiddleware, listarCompras);
router.get('/:id', authMiddleware, obtenerCompraPorId);
router.patch("/:id/anular",authMiddleware, eliminarCompra); // Anular compra OK


export default router;
