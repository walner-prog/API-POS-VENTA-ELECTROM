// controllers/tiposServicio.controller.js
import * as tiposService from '../services/tiposServicio.service.js';

export async function crearTipo(req, res) {
  try {
    const tipo = await tiposService.crearTipoServicioService(req.body);
    res.json({ success: true, tipo });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || err });
  }
}

export async function listarTipos(req, res) {
  try {
    const result = await tiposService.listarTiposServicioService(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || err });
  }
}

export async function eliminarTipo(req, res) {
  try {
    const { id } = req.params;
    const result = await tiposService.eliminarTipoServicioService(id);
    res.json({ success: true, result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || err });
  }
}
