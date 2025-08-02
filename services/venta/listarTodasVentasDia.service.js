import { Venta, Caja, Usuario } from "../../models/index.js";
import { Op } from 'sequelize';

export const obtenerVentasDelDia = async ({ pagina = 1, limite = 5, estado = null, caja_id = null }) => {
    const offset = (pagina - 1) * limite;

    // --- COMIENZO DE LA CORRECCIÓN ---
    // Usamos el offset de tu zona horaria local (Nicaragua: UTC-6)
    const offsetUTC = -6 * 60; // -360 minutos
    const ahora = new Date();

    console.log(`Fecha y hora actual en UTC: ${ahora.toISOString()}`);
    
    // Obtener la fecha del día en tu zona horaria
    const fechaLocal = new Date(ahora.getTime() + (ahora.getTimezoneOffset() * 60000) + (offsetUTC * 60000));
    
    // Establecer el inicio del día en tu zona horaria
    const inicioDelDiaLocal = new Date(fechaLocal);
    inicioDelDiaLocal.setHours(0, 0, 0, 0);

    // Establecer el fin del día en tu zona horaria
    const finDelDiaLocal = new Date(fechaLocal);
    finDelDiaLocal.setHours(23, 59, 59, 999);
    
    // Convertir de nuevo a UTC para la consulta a la base de datos
    const inicioUTC = new Date(inicioDelDiaLocal.getTime() - (inicioDelDiaLocal.getTimezoneOffset() * 60000));
    const finUTC = new Date(finDelDiaLocal.getTime() - (finDelDiaLocal.getTimezoneOffset() * 60000));
    // --- FIN DE LA CORRECCIÓN ---

    const whereClause = {
        created_at: {
            [Op.between]: [inicioUTC, finUTC] // Usamos las fechas ya corregidas
        }
    };

    if (estado) whereClause.estado = estado;
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
