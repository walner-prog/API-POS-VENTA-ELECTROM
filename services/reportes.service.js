import { Op, literal, fn } from 'sequelize';
import { Venta, DetalleVenta, Producto } from '../models/index.js';

/**
 * Obtiene los totales de ventas y ganancias para un rango de fechas.
 * @param {Date} fechaInicio - La fecha de inicio del rango.
 * @param {Date} fechaFin - La fecha de fin del rango.
 * @returns {Promise<{totalVentas: number, totalGanancias: number}>} - Un objeto con los totales.
 */
export async function obtenerReporteTotales(fechaInicio, fechaFin) {
  try {
    // 1. Obtener todas las ventas completadas con sus totales y descuentos
    const ventasCompletadas = await Venta.findAll({
      attributes: ['id', 'total', 'descuento'],
      where: {
        estado: 'completada',
        created_at: {
          [Op.between]: [fechaInicio, fechaFin]
        }
      },
      raw: true
    });

    const totalVentas = ventasCompletadas.reduce((sum, venta) => sum + parseFloat(venta.total), 0);
    const ventasIds = ventasCompletadas.map(venta => venta.id);

    // Si no hay ventas, no hay nada que calcular
    if (ventasIds.length === 0) {
      return {
        totalVentas: 0,
        totalGanancias: 0
      };
    }
    
    // 2. Obtener el costo total de los productos vendidos para esas ventas
    const costoVentas = await DetalleVenta.findAll({
      attributes: [
        [fn('SUM', literal('`DetalleVenta`.`cantidad` * `Producto`.`precio_compra`')), 'costoTotalProductos']
      ],
      where: {
        venta_id: {
          [Op.in]: ventasIds
        }
      },
      include: [{
        model: Producto,
        attributes: []
      }],
      raw: true
    });

    const costoTotalProductos = parseFloat(costoVentas[0]?.costoTotalProductos) || 0;

    // 3. Calcular la ganancia total
    // Ganancia = (Total de Ventas - Costo de los Productos)
    const totalGanancias = totalVentas - costoTotalProductos;
    
    return {
      totalVentas: totalVentas,
      totalGanancias: totalGanancias
    };

  } catch (error) {
    console.error('Error al obtener el reporte de totales:', error);
    throw new Error('Error al obtener los totales de ventas y ganancias.');
  }
}


export async function obtenerReporteTotalesDetallado(fechaInicio, fechaFin) {
  try {
    // 1. Obtener todas las ventas completadas con sus totales y descuentos ajustemos la fecha fin para incluir todo el día

    fechaFin.setHours(23, 59, 59, 999);
    const ventasCompletadas = await Venta.findAll({
      attributes: ['id', 'subtotal', 'descuento', 'total'],
      where: {
        estado: 'completada',
        created_at: { [Op.between]: [fechaInicio, fechaFin] }
      },
      raw: true
    });

    if (!ventasCompletadas.length) {
      return {
        subtotalVentas: 0,
        totalDescuentos: 0,
        totalVentas: 0,
        costoTotalProductos: 0,
        totalGanancias: 0
      };
    }

    const ventasIds = ventasCompletadas.map(v => v.id);

    // 2. Sumar subtotales, descuentos y total de ventas
    const subtotalVentas = ventasCompletadas.reduce((sum, v) => sum + parseFloat(v.subtotal), 0);
    const totalDescuentos = ventasCompletadas.reduce((sum, v) => sum + parseFloat(v.descuento), 0);
    const totalVentas = ventasCompletadas.reduce((sum, v) => sum + parseFloat(v.total), 0);

    // 3. Calcular costo total considerando cada línea de detalle
    const costoVentas = await DetalleVenta.findAll({
      attributes: [
        [fn('SUM', literal('`DetalleVenta`.`cantidad` * `Producto`.`precio_compra`')), 'costoTotalProductos']
      ],
      where: { venta_id: { [Op.in]: ventasIds } },
      include: [{ model: Producto, attributes: [] }],
      raw: true
    });

    const costoTotalProductos = parseFloat(costoVentas[0]?.costoTotalProductos) || 0;

    // 4. Ganancia neta
    const totalGanancias = totalVentas - costoTotalProductos;

    return {
      subtotalVentas,
      totalDescuentos,
      totalVentas,
      costoTotalProductos,
      totalGanancias
    };

  } catch (error) {
    console.error('Error al obtener el reporte detallado de totales:', error);
    throw new Error('Error al obtener el reporte detallado de ventas y ganancias.');
  }
}



