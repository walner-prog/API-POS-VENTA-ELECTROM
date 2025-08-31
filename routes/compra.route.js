// backend/routes/compra.routes.js
import express from 'express';
import multer from 'multer';
import authMiddleware from '../middlewares/auth.js';
import { registrarCompra, listarCompras, obtenerCompraPorId, eliminarCompra } from '../controllers/compra.controller.js';

const router = express.Router();

// Configuración Multer (archivo en memoria)
const storage = multer.memoryStorage(); // o diskStorage si quieres guardar temporal
const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB máximo
});

// Ruta POST con archivo
router.post('/', authMiddleware, upload.single('factura_imagen'), registrarCompra);
router.get('/', authMiddleware, listarCompras);
router.get('/:id', authMiddleware, obtenerCompraPorId);
router.patch('/:id', authMiddleware, eliminarCompra);

export default router;
