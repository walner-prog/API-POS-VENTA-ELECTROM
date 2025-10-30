import express from 'express'
import {
  obtenerConfiguracion,
  actualizarConfiguracion
} from '../controllers/configuracion.Controller.js'

const router = express.Router()

router.get('/', obtenerConfiguracion)
router.put('/', actualizarConfiguracion)

export default router
