import express from 'express';
import { registrarCompra, listarCompras, obtenerCompraPorId } from '../controllers/compra.controller.js';
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();

router.post('/', authMiddleware, registrarCompra);
router.get('/', authMiddleware, listarCompras);
router.get('/:id', authMiddleware, obtenerCompraPorId);

export default router;
