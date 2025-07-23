import { 
  registrarUsuarioService, 
  loginUsuarioService, 
  listarUsuariosService, 
  actualizarUsuarioService, 
  eliminarUsuarioService, 
  verPerfilService,
  cambiarPasswordService,
  registrarUsuarioComoAdminService,
  obtenerUsuarioPorIdService,
  recuperarCuentaService
} from '../services/usuario.service.js';

export const registrarUsuario = async (req, res) => {
  try {
    const result = await registrarUsuarioService(req.body);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || 'Error interno' });
  }
};

export const loginUsuario = async (req, res) => {
  try {
    const result = await loginUsuarioService(req.body);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || 'Error interno' });
  }
};


export const listarUsuarios = async (req, res) => {
  try {
    // Aquí pasarías la página y búsqueda desde query params si quieres paginar bien
    const pagina = parseInt(req.query.page) || 1;
    const busqueda = req.query.search || '';
    const result = await listarUsuariosService(pagina, busqueda);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno' });
    console.error("Error en listarUsuarios:", error);
  }
};

 

export async function obtenerUsuarioPorIdController(req, res) {
  try {
    const { id } = req.params;
    const usuario = await obtenerUsuarioPorIdService(id);
    res.json({ success: true, usuario });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Error al obtener usuario'
    });
  }
}


export const actualizarUsuario = async (req, res) => {
  try {
    const usuarioActualId = req.usuario.id;
    const usuarioActualRol = req.usuario.rol; 
    
    const result = await actualizarUsuarioService(req.params.id, req.body, usuarioActualId, usuarioActualRol);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || 'Error interno' });
  }
};


export const eliminarUsuario = async (req, res) => {
  try {
    const result = await eliminarUsuarioService(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || 'Error interno' });
  }
};

export const verPerfil = async (req, res) => {
  try {
    const id = req.usuario.id;
    const data = await verPerfilService(id);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || 'Error interno' });
  }
}


export const cambiarPassword = async (req, res) => {
  try {
    const result = await cambiarPasswordService(req.usuario.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || 'Error interno' });
  }
};


export const crearUsuarioDesdeAdmin = async (req, res) => {
  try {
    const creador_id = req.usuario.id; // este valor viene del token/session
    const data = { ...req.body, creador_id };
    const result = await registrarUsuarioComoAdminService(data);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Error interno'
    });
  }
};

export const recuperarCuenta = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await recuperarCuentaService(email);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Error al recuperar cuenta'
    });
  } 
};
