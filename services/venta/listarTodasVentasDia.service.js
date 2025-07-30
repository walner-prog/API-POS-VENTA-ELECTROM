import { Venta, Caja, Usuario } from "../../models/index.js";
import { Op } from 'sequelize';

export const obtenerVentasDelDia = async ({ pagina = 1, limite = 5, estado = null, caja_id = null }) => {
  const offset = (pagina - 1) * limite;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const mañana = new Date();
  mañana.setHours(23, 59, 59, 999);

  const whereClause = {
    created_at: {
      [Op.between]: [hoy, mañana]
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
    limit,
    offset
  });

  return {
    ventas,
    total,
    paginaActual: parseInt(pagina),
    totalPaginas: Math.ceil(total / limite)
  };
};
