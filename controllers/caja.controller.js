import {
  abrirCajaService,
  cerrarCajaService,
  listarCierresService,
  cajaActualService,
  verCajaAbiertaService,
  historialCierresService
} from '../services/caja.service.js'
 
import { abrirCajaSchema } from '../validator/AbrirCaja.schema.js';

export const abrirCaja = async (req, res) => {
  try {
    const { error, value } = abrirCajaSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const detalles = error.details.map(e => ({
        campo: e.context.key,
        error: e.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        details: detalles
      });
    }

    const data = await abrirCajaService(value, req.usuario.id);
    res.json(data);
    
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};



export const cerrarCaja = async (req, res) => {
  try {
    const data = await cerrarCajaService(req.params.id, req.usuario.id)
    res.json(data)
  } catch (error) {
  //  console.log("Error en cerrarCaja:", error)
    res.status(error.status || 500).json({ success: false, message: error.message || 'Error interno' })
  }
}

export const listarCierres = async (req, res) => {
  try {
    const usuario_id = req.usuario.id;
    const { pagina = 1, limite = 10, desde, hasta } = req.query;

    const data = await listarCierresService(usuario_id, pagina, limite, desde, hasta);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || 'Error interno' });
  }
};


export const verCajaAbierta = async (req, res) => {
  try {
    const usuario_id = req.usuario.id;
    const data = await verCajaAbiertaService(usuario_id);
    res.json(data);
  } catch (error) {
  //  console.log("Error en verCajaAbierta:", error)
    res.status(error.status || 500).json({ success: false, message: error.message || 'Error interno' });
  }
}

export const historialCierres = async (req, res) => {
  try {
    const usuario_id = req.usuario.id;
    const { desde, hasta, pagina = 1, limite = 10 } = req.query;

    const data = await historialCierresService(usuario_id, desde, hasta, pagina, limite);

    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || 'Error interno' });
  }
};

export const cajaActual = async (req, res) => {
  try {
    const data = await cajaActualService(req.usuario.id)
    res.json(data)
  } catch (error) {
  //  console.log("Error en cajaActual:", error)
    res.status(500).json({ success: false, message: 'Error interno' })
  }
}