import {
  crearEgresoService,
  listarEgresosPorCajaService,
  anularEgresoService,
  editarEgresoService
} from '../services/egreso.service.js'

export const crearEgreso = async (req, res) => {
  try {
    const usuario_id = req.usuario.id
    const data = await crearEgresoService(req.body, usuario_id)
    res.json(data)
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || 'Error interno' })
  }
}

export const actualizarEgreso = async (req, res) => {
  try {
    const egreso_id = req.params.id
    const datos = req.body
    const usuario_id = req.usuario.id

    const resultado = await editarEgresoService(egreso_id, datos, usuario_id)

    res.json(resultado)
  } catch (error) {
    console.error(error)
    res.status(error.status || 500).json({
      message: error.message || 'Error al actualizar el egreso'
    })
  }
}

export const listarEgresosPorCaja = async (req, res) => {
  try {
    const { caja_id } = req.params
    const { page = 1, limit = 10, tipo } = req.query

    const data = await listarEgresosPorCajaService({
      caja_id,
      tipo,
      page: parseInt(page),
      limit: parseInt(limit)
    })

    res.json(data)
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Error interno'
    })
  }
}

 

export const anularEgreso = async (req, res) => {
  try {
    const usuario_id = req.usuario.id;
    const permisos = req.usuario?.Rol?.Permisos?.map(p => p.nombre) || [];
    const { egreso_id } = req.params;

    const resultado = await anularEgresoService(egreso_id, usuario_id, permisos);
    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Error al anular egreso'
    });
  }
};


