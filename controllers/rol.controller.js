import { 
  listarRolesService, 
  crearRolService, 
  actualizarRolService, 
  eliminarRolService ,
  listarPermisosService

} from '../services/rol.service.js'

export const listarRoles = async (req, res) => {
  try {
    const result = await listarRolesService()
    res.json(result)
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || 'Error interno' })
  }
}

export const crearRol = async (req, res) => {
  try {
    const { nombre, permisos } = req.body // permisos: ['crear_ventas', 'ver_reportes']
    const result = await crearRolService({ nombre, permisos })
    res.json(result)
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || 'Error interno' })
  }
}

export const actualizarRol = async (req, res) => {
  try {
    const result = await actualizarRolService(req.params.id, req.body)
    res.json(result)
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || 'Error interno' })
  }
}

export const eliminarRol = async (req, res) => {
  try {
    const result = await eliminarRolService(req.params.id)
    res.json(result)
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || 'Error interno' })
  }
}

export const listarPermisos = async (req, res) => {
  try {
    const permisos = await listarPermisosService()
    res.json({ success: true, permisos })
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || 'Error interno' })
  }
}
