import { cancelarVentaService } from '../services/venta/cancelarVenta.service.js';
import { crearVentaService } from '../services/venta/crearVenta.service.js';
import { obtenerDetalleVentaService } from '../services/venta/listarVentaId.service.js';
import { obtenerVentasDelDia } from '../services/venta/listarTodasVentasDia.service.js';
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
    await validarCancelacion(req.body);
    const { motivo } = req.body;
    const venta_id = req.params.id; 

    const data = await cancelarVentaService(venta_id, motivo, req.usuario.id);
  //  logger.info(`⚠️ Venta cancelada - ID Venta: ${venta_id} por el usuario ${req.usuario.id} con motivo: "${motivo}"`);
    
    res.json(data);
  } catch (error) {
    // logger.error(`❌ Error al cancelar venta ID ${req.params.id} por el usuario ${req.usuario.id}: ${error.message}`);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Error interno'
    });
  }
};

export const listarVentasDelDia = async (req, res) => {
  console.log("📦 Llegó a listarVentasDelDia");

  try {
    const ventas = await obtenerVentasDelDia();
    res.json({ success: true, ventas });
  } catch (error) {
    console.error('Error al obtener ventas del día:', error);
    res.status(500).json({ success: false, message: 'Error al obtener ventas' });
  }
};
