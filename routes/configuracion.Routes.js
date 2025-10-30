import express from 'express'
import {
  obtenerConfiguracion,
  actualizarConfiguracion
} from '../controllers/configuracion.Controller.js'
import authMiddleware from '../middlewares/auth.js';

const router = express.Router()
 
router.get('/', obtenerConfiguracion, authMiddleware);
router.put('/', actualizarConfiguracion, authMiddleware);

export default router
