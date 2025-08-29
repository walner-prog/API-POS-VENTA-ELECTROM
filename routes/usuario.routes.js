import express from 'express'
import { 
  registrarUsuario, 
  loginUsuario, 
  listarUsuarios, 
  actualizarUsuario, 
  eliminarUsuario, 
  verPerfil, 
  cambiarPassword,
  crearUsuarioDesdeAdmin,
  obtenerUsuarioPorIdController,
  recuperarCuenta
} from '../controllers/usuario.controller.js'
import authMiddleware from '../middlewares/auth.js'
import isAdmin from '../middlewares/isAdmin.js'
import tienePermiso from '../middlewares/tienePermiso.js'

const router = express.Router()

// Público
router.post('/registro', registrarUsuario)
router.post('/login', loginUsuario) 
router.post('/recuperar-cuenta', recuperarCuenta);


// Protegido
router.get('/perfil', authMiddleware, verPerfil)


// Solo admin
router.post('/registro-admin', authMiddleware, isAdmin,   crearUsuarioDesdeAdmin)
router.post('/cambiar-password', authMiddleware, cambiarPassword)
router.get('/', authMiddleware, isAdmin, listarUsuarios)
router.put('/:id', authMiddleware, isAdmin, actualizarUsuario)
router.delete('/:id', authMiddleware, isAdmin, eliminarUsuario)
router.get('/:id', authMiddleware, isAdmin, obtenerUsuarioPorIdController);


export default router
