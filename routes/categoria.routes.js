import express from 'express'
import {
  listarCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  listarProductosPorCategoria
} from '../controllers/categoria.controller.js'
import authMiddleware from '../middlewares/auth.js'


const router = express.Router()

router.get('/', authMiddleware, listarCategorias)
router.post('/', authMiddleware, crearCategoria)
router.put('/:id', authMiddleware, actualizarCategoria)
router.delete('/:id', authMiddleware, eliminarCategoria)
router.get('/:id', authMiddleware, listarProductosPorCategoria)

export default router
