import { cancelarVentaService } from '../services/venta/cancelarVenta.service.js';
import { crearVentaService } from '../services/venta/crearVenta.service.js';
import { obtenerDetalleVentaService } from '../services/venta/listarVentaId.service.js';
import { obtenerVentasDelDia } from '../services/venta/listarTodasVentasDia.service.js';
import { obtenerTotalesVentasPorCajaService } from '../services/venta/totalesVentasDia.service.js';
import { validarVenta, validarCancelacion } from '../validator/venta.validacion.js';
import logger from "../config/logger.js";
  //  await validarVenta(req.body);
export const crearVenta = async (req, res) => {
  try {

    const data = await crearVentaService(req.body, req.usuario.id);

  //  logger.info(`✅ Venta creada exitosamente por el usuario ${req.usuario.id} - ID Venta: ${data.venta_id}`);
    res.json(data);
  } catch (error) {
   // logger.error(`❌ Error al crear venta por el usuario ${req.usuario.id}: ${error.message}`);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Error interno'
    });
  }
};
  
export async function obtenerDetalleVentaPorId(req, res) {
  try {
    const id = req.params.id;
    const venta = await obtenerDetalleVentaService(id);
    res.json(venta);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
}

 
export const cancelarVenta = async (req, res) => {
  try {
    const { motivo } = req.body;
    const venta_id = req.params.id; 

    const data = await cancelarVentaService(venta_id, motivo, req.usuario.id);
    
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Error interno'
    });
  }
};


export const listarVentasDelDia = async (req, res) => {
  try {
    const { pagina = 1, limite = 5, estado = null, caja_id = null } = req.query;

    const resultado = await obtenerVentasDelDia({
      pagina: Number(pagina),
      limite: Number(limite),
      estado: estado || null,
      caja_id: caja_id ? Number(caja_id) : null
    });

    res.json({ success: true, ...resultado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al obtener ventas' });
  }
};

export const obtenerTotalesVentasPorCajaController = async (req, res) => {
  try {
    const { caja_id } = req.params;

    if (!caja_id) {
      return res.status(400).json({ message: 'Caja ID requerido' });
    }

    const totales = await obtenerTotalesVentasPorCajaService(caja_id);
    res.json(totales);
  } catch (error) {
    console.error('Error al obtener totales por caja:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

