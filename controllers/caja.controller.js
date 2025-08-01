import {
  abrirCajaService,
  cerrarCajaService,
  listarCierresService,
  cajaActualService,
  verCajaAbiertaService,
  historialCierresService,
  listarCajasParaSelectorService
 
} from '../services/caja.service.js'
 
 

export const abrirCaja = async (req, res) => {
  try {
    const { monto_inicial, observacion, nombre } = req.body;
    const usuario_id_cajero = req.usuario.id;

    const data = await abrirCajaService(
      { monto_inicial, observacion, nombre },
      usuario_id_cajero
    );

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


export const verCajaAbiertaId = async (req, res) => {
  try {
    const usuario_id = req.usuario.id; // lo provee authMiddleware
    const data = await verCajaAbiertaService(usuario_id);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Error al obtener caja abierta'
    });
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
    const { desde, hasta, pagina = 1, limite = 5, estadoCaja } = req.query;

    const data = await historialCierresService(usuario_id, desde, hasta, pagina, limite, estadoCaja);

    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || 'Error interno' });
  }
};


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


export const cajaActual = async (req, res) => {
  try {
    const data = await cajaActualService(req.usuario.id)
    res.json(data)
  } catch (error) {
  //  console.log("Error en cajaActual:", error)
    res.status(500).json({ success: false, message: 'Error interno' })
  }
}

export const obtenerCajasUltimos31Dias = async (req, res) => {
  try {
    const data = await listarCajasParaSelectorService(req.usuario.id);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Error al obtener cajas de los últimos 31 días'
    });
  }
};