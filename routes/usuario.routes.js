import express from 'express'
import { 
  registrarUsuario, 
  loginUsuario, 
  listarUsuarios, 
  actualizarUsuario, 
  eliminarUsuario, 
  verPerfil, 
  cambiarPassword,
  crearUsuarioDesdeAdmin
} from '../controllers/usuario.controller.js'
import authMiddleware from '../middlewares/auth.js'
import isAdmin from '../middlewares/isAdmin.js'
import tienePermiso from '../middlewares/tienePermiso.js'

const router = express.Router()

// Público
router.post('/registro', registrarUsuario)
router.post('/login', loginUsuario) 

// Protegido
router.get('/perfil', authMiddleware, verPerfil)


// Solo admin
router.post('/registro-admin', authMiddleware, isAdmin, tienePermiso('crear_usuarios'), crearUsuarioDesdeAdmin)
router.post('/cambiar-password', authMiddleware, cambiarPassword)
router.get('/', authMiddleware, isAdmin, listarUsuarios)
router.put('/:id', authMiddleware, isAdmin, actualizarUsuario)
router.delete('/:id', authMiddleware, isAdmin, eliminarUsuario)


export default router
