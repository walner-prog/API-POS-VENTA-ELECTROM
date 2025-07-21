import express from 'express'
import {
  listarCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria
} from '../controllers/categoria.controller.js'
import authMiddleware from '../middlewares/auth.js'


const router = express.Router()

router.get('/', authMiddleware, listarCategorias)
router.post('/', authMiddleware, crearCategoria)
router.put('/:id', authMiddleware, actualizarCategoria)
router.delete('/:id', authMiddleware, eliminarCategoria)

export default router
