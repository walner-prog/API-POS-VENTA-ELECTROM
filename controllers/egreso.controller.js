import {
  crearEgresoService,
  listarEgresosPorCajaService,
  anularEgresoService
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
    const egreso_id = req.params.egreso_id
    const usuario_id = req.usuario.id  // Suponiendo que tienes middleware de auth que pone el usuario en req.usuario

    const resultado = await anularEgresoService(egreso_id, usuario_id)

    res.json({ success: true, message: resultado.message })
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Error interno al anular egreso'
    })
  }
}

