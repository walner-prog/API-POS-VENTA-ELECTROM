import { Op } from 'sequelize';
import { Venta } from "../../models/index.js";
// Importamos la función de utilidad y el offset
import { getDailyDateRange, NICARAGUA_OFFSET_MINUTES } from "../../utils/dateUtils.js";

export const obtenerVentasDelDia = async ({ pagina = 1, limite = 5, estado = 'completada', caja_id = null }) => {
    const offset = (pagina - 1) * limite;

    // Usamos la función de utilidad para obtener las fechas
    const { inicioUTC, finUTC } = getDailyDateRange(NICARAGUA_OFFSET_MINUTES);

    const whereClause = {
        created_at: {
            [Op.between]: [inicioUTC, finUTC] // Usamos las fechas que ya vienen corregidas
        }
    };

    // Aseguramos que el estado por defecto sea 'completada' si no se especifica
    if (estado) {
        whereClause.estado = estado;
    } else {
        whereClause.estado = 'completada';
    }

    if (caja_id) whereClause.caja_id = caja_id;

    const { rows: ventas, count: total } = await Venta.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: Caja,
                include: [{ model: Usuario, attributes: ['id', 'nombre'] }]
            },
            {
                model: Usuario,
                attributes: ['id', 'nombre']
            }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limite),
        offset
    });

    return {
        ventas,
        total,
        paginaActual: parseInt(pagina),
        totalPaginas: Math.ceil(total / limite)
    };
};

