// controllers/servicio.controller.js
import * as servicioService from '../services/servicio.service.js';

export async function crearServicio(req, res) {
  try {
    const usuario = req.usuario; // <-- usuario completo

    const servicio = await servicioService.crearServicioService(req.body, usuario);
    res.json({ success: true, servicio });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || err });
  }
}


export async function listarServicios(req, res) {
  try {
    const result = await servicioService.listarServiciosService(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || err });
  }
}

export async function eliminarServicio(req, res) {
  try {
    const usuario = req.user;
    const { id } = req.params;
    const result = await servicioService.eliminarServicioService(id, usuario.id);
    res.json({ success: true, result });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || err });
  }
}
