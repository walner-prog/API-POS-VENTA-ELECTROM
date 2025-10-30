import { Op, fn, col, literal } from "sequelize";
import Venta from "../../models/Venta.js";

// Función general para agrupar por rango de fechas
const obtenerVentasAgrupadas = async (inicio, fin, intervalo = "week") => {
  let formato;

  switch (intervalo) {
    case "week":
      formato = "%Y-%u"; // año-semana
      break;
    case "month":
      formato = "%Y-%m"; // año-mes
      break;
    case "6months":
      formato = "%Y-%m"; // agruparemos por mes, luego limitamos 6
      break;
    case "year":
      formato = "%Y"; // año
      break;
    default:
      formato = "%Y-%m-%d";
  }

  const ventas = await Venta.findAll({
    where: {
      estado: "completada",
      created_at: {
        [Op.between]: [inicio, fin],
      },
    },
    attributes: [
      [fn("DATE_FORMAT", col("created_at"), formato), "periodo"],
      [fn("SUM", col("total")), "total"],
      [fn("SUM", col("subtotal")), "subtotal"],
      [fn("SUM", col("descuento")), "descuento"],
      [fn("COUNT", col("id")), "cantidad"],
    ],
    group: ["periodo"],
    order: [[literal("periodo"), "ASC"]],
    raw: true,
  });

  return ventas;
};

// Totales generales (cards)
const obtenerTotalesGlobales = async () => {
  const data = await Venta.findOne({
    where: { estado: "completada" },
    attributes: [
      [fn("SUM", col("subtotal")), "subtotal"],
      [fn("SUM", col("descuento")), "descuento"],
      [fn("SUM", col("total")), "total"],
      [fn("COUNT", col("id")), "ventas_totales"],
    ],
    raw: true,
  });
  return data;
};

// Servicio principal
export const reportesService = {
  semanal: (inicio, fin) => obtenerVentasAgrupadas(inicio, fin, "week"),
  mensual: (inicio, fin) => obtenerVentasAgrupadas(inicio, fin, "month"),
  seisMeses: (inicio, fin) => obtenerVentasAgrupadas(inicio, fin, "6months"),
  anual: (inicio, fin) => obtenerVentasAgrupadas(inicio, fin, "year"),
  totales: obtenerTotalesGlobales,
};
