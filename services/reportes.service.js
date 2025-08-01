import { Op, literal, fn, col } from 'sequelize';
import { Venta, DetalleVenta, Producto } from '../models/index.js';

/**
 * Obtiene los totales de ventas y ganancias para un rango de fechas.
 * @param {Date} fechaInicio - La fecha de inicio del rango.
 * @param {Date} fechaFin - La fecha de fin del rango.
 * @returns {Promise<{totalVentas: number, totalGanancias: number}>} - Un objeto con los totales.
 */
export async function obtenerReporteTotales(fechaInicio, fechaFin) {
  try {
    // Totales de ventas completadas
    const totalVentasCompletadas = await Venta.sum('total', {
      where: {
        estado: 'completada',
        created_at: {
          [Op.between]: [fechaInicio, fechaFin]
        }
      }
    });

    // Subconsulta para calcular la ganancia de cada detalle de venta
    const detallesGanancia = await DetalleVenta.findAll({
      attributes: [
        [fn('SUM', literal('`DetalleVenta`.`cantidad` * (`Producto`.`precio_venta` - `Producto`.`precio_compra`)')), 'gananciaBruta'],
        [fn('SUM', literal('`DetalleVenta`.`cantidad` * `Producto`.`precio_venta`')), 'totalVentaDetalles']
      ],
      include: [{
        model: Producto,
        attributes: []
      }, {
        model: Venta,
        where: {
          estado: 'completada',
          created_at: {
            [Op.between]: [fechaInicio, fechaFin]
          }
        },
        attributes: ['descuento']
      }],
      raw: true,
      // Usar la sintaxis de Sequelize para referenciar la columna del modelo asociado
      group: [col('Venta.id')] 
    });

    let totalGanancias = 0;

    detallesGanancia.forEach(item => {
      // El alias 'Venta.descuento' que Sequelize te da en raw:true es correcto
      const gananciaBrutaVenta = parseFloat(item.gananciaBruta) || 0;
      const descuentoVenta = parseFloat(item['Venta.descuento']) || 0; 
      const totalVentaDetalles = parseFloat(item.totalVentaDetalles) || 0;

      // Calcular la ganancia neta de cada venta, ajustando por el descuento
      const gananciaNetaVenta = gananciaBrutaVenta - (descuentoVenta * (gananciaBrutaVenta / totalVentaDetalles));

      totalGanancias += gananciaNetaVenta;
    });

    const totalVentas = parseFloat(totalVentasCompletadas) || 0;
    
    return {
      totalVentas: totalVentas,
      totalGanancias: totalGanancias
    };

  } catch (error) {
    console.error('Error al obtener el reporte de totales:', error);
    throw new Error('Error al obtener los totales de ventas y ganancias.');
  }
}