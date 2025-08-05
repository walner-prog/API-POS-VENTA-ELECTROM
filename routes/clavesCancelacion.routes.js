import express from 'express';
import {
  listarClaves,
  crearClave,
  activarClave,
  eliminarClave,
  validarClave
} from '../controllers/clavesCancelacion.controller.js';

import authMiddleware from '../middlewares/auth.js';      // Protege las rutas
import isAdmin from '../middlewares/isAdmin.js';          // Verifica si el usuario es admin

const router = express.Router();

// 🔐 Solo admins pueden listar, crear, activar y eliminar claves
router.get('/', authMiddleware, isAdmin, listarClaves);
router.post('/', authMiddleware, isAdmin, crearClave);
router.patch('/:id/activar', authMiddleware, isAdmin, activarClave);
router.delete('/:id', authMiddleware, isAdmin, eliminarClave);

// ✅ Pública: usada por los cajeros para validar clave desde el POS
router.post('/validar', validarClave);

export default router;
