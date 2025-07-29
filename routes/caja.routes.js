import express from 'express'
import {
  abrirCaja, 
  cerrarCaja,
  listarCierres,
  cajaActual,
  verCajaAbierta,
  historialCierres,
  
} from '../controllers/caja.controller.js'
import authMiddleware from '../middlewares/auth.js'

const router = express.Router()

router.post('/abrir', authMiddleware, abrirCaja)
router.post('/cerrar/:id', authMiddleware, cerrarCaja)
router.get('/cierres', authMiddleware, listarCierres)
router.get('/abierta', authMiddleware, verCajaAbierta)
 
router.get('/historial', authMiddleware, historialCierres)
router.get('/actual', authMiddleware, cajaActual)
export default router
