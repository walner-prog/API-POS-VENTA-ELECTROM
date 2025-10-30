import {
  obtenerConfiguracionService,
  actualizarConfiguracionService
} from '../services/configuracion.Service.js'

export async function obtenerConfiguracion(req, res) {
  try {
    const config = await obtenerConfiguracionService()
    res.json(config)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export async function actualizarConfiguracion(req, res) {
  try {
    const config = await actualizarConfiguracionService(req.body)
    res.json(config)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
