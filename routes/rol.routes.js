import express from 'express'
import { 
  listarRoles, 
  crearRol, 
  actualizarRol, 
  eliminarRol,
  listarPermisos
} from '../controllers/rol.controller.js'
import authMiddleware from '../middlewares/auth.js'
import isAdmin from '../middlewares/isAdmin.js'

const router = express.Router()

// Solo admin puede gestionar roles
// Endpoint para listar todos los permisos disponibles
router.get('/permisos', isAdmin, listarPermisos)

router.get('/', authMiddleware, listarRoles)
router.post('/', authMiddleware, isAdmin, crearRol)
router.put('/:id', authMiddleware, isAdmin, actualizarRol)
router.delete('/:id', authMiddleware, isAdmin, eliminarRol)

export default router
