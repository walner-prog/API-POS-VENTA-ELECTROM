import { Venta, Caja, Usuario } from '../models/index.js';
import { Op } from 'sequelize';

export const obtenerVentasDelDia = async () => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const mañana = new Date();
  mañana.setHours(23, 59, 59, 999);

  const ventas = await Venta.findAll({
    where: {
      created_at: {
        [Op.between]: [hoy, mañana]
      },
      estado: 'completada'
    },
    include: [
      {
        model: Caja,
        include: [{ model: Usuario, attributes: ['id', 'nombre'] }]
      },
      {
        model: Usuario, // Usuario que registró la venta
        attributes: ['id', 'nombre']
      }
    ],
    order: [['created_at', 'DESC']]
  });

  return ventas;
};
