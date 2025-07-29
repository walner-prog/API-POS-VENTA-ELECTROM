import express from 'express'
import { crearEgreso, listarEgresosPorCaja,anularEgreso,actualizarEgreso} from '../controllers/egreso.controller.js'
import authMiddleware from '../middlewares/auth.js'

const router = express.Router()

router.post('/', authMiddleware, crearEgreso)
router.put('/:id', authMiddleware, actualizarEgreso)
router.get('/caja/:caja_id', authMiddleware, listarEgresosPorCaja)
router.put('/anular/:egreso_id', authMiddleware, anularEgreso)

export default router
