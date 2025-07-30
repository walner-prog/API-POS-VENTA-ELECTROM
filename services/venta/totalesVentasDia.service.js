import { Op } from 'sequelize';
import { Venta } from "../../models/index.js";

export const obtenerTotalesVentasDelDiaService = async () => {
  const hoyInicio = new Date();
  hoyInicio.setHours(0, 0, 0, 0);

  const hoyFin = new Date();
  hoyFin.setHours(23, 59, 59, 999);

  const ventas = await Venta.findAll({
    where: {
      created_at: {
        [Op.between]: [hoyInicio, hoyFin]
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
