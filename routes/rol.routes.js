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
router.get('/permisos', listarPermisos)// el acceso se condiciono con un middleware solo para roles 

router.get('/', authMiddleware, listarRoles)// el acceso se condiciono con un middleware solo para roles 
router.post('/', authMiddleware, isAdmin, crearRol)
router.put('/:id', authMiddleware, isAdmin, actualizarRol)
router.delete('/:id', authMiddleware, isAdmin, eliminarRol)

export default router
