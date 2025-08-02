import { Op } from 'sequelize';
import { Venta } from "../../models/index.js";

 
// Importamos la función de utilidad y el offset
import { getDailyDateRange, NICARAGUA_OFFSET_MINUTES } from "../../utils/dateUtils.js";

export const obtenerTotalesVentasPorCajaService = async (caja_id) => { 
    // Usamos la función de utilidad para obtener el rango de fechas correcto
    const { inicioUTC, finUTC } = getDailyDateRange(NICARAGUA_OFFSET_MINUTES);

    const ventas = await Venta.findAll({
        where: {
            caja_id,
            estado: 'completada', 
            created_at: {
                [Op.between]: [inicioUTC, finUTC] // ✅ Usamos las fechas corregidas
            }
        },
        attributes: ['subtotal', 'descuento', 'total']
    });

    const totales = ventas.reduce(
        (acc, venta) => {
            acc.subtotal += parseFloat(venta.subtotal || 0);
            acc.descuento += parseFloat(venta.descuento || 0);
            acc.total += parseFloat(venta.total || 0);
            return acc;
        },
        { subtotal: 0, descuento: 0, total: 0 }
    );

    return totales;
};


