import express from 'express'
import {
  abrirCaja, 
  cerrarCaja,
  listarCierres,
  cajaActual,
  verCajaAbierta,
  historialCierres,
  obtenerCajasUltimos31Dias,
  agregarMontoInicialCajaController,
  listarCajasAdministracion
} from '../controllers/caja.controller.js'
import authMiddleware from '../middlewares/auth.js'

const router = express.Router()

router.post('/abrir', authMiddleware, abrirCaja)
router.post('/cerrar/:id', authMiddleware, cerrarCaja)
router.get('/cierres', authMiddleware, listarCierres)
router.get('/abierta', authMiddleware, verCajaAbierta)
router.get('/ultimos-31-dias-selector', authMiddleware, obtenerCajasUltimos31Dias)
router.get('/historial', authMiddleware, historialCierres)
router.get('/actual', authMiddleware, cajaActual)
router.post("/agregar-monto-inicial", authMiddleware, agregarMontoInicialCajaController);
router.get('/administracion/cajas', listarCajasAdministracion);
export default router
