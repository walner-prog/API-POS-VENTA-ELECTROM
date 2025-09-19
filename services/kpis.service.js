import { Venta, Egreso, Producto, Categoria, Usuario, Rol } from "../models/index.js";
import { Op } from "sequelize";
import { subDays, subMonths, startOfDay } from "date-fns";

async function getKpis() {
  const hoy = new Date();

  // Rango de fechas
  const rangos = {
    "7dias": subDays(hoy, 7),
    "1mes": subMonths(hoy, 1),
    "3meses": subMonths(hoy, 3),
    "6meses": subMonths(hoy, 6),
    "1anio": subMonths(hoy, 12)
  };

  const resultados = {};

  // 🔹 KPIs de ventas y egresos
  for (const [key, fecha] of Object.entries(rangos)) {
    const ventas = await Venta.sum("total", {
      where: {
        created_at: { [Op.gte]: startOfDay(fecha) },
        estado: "completada"
      }
    });

    const egresos = await Egreso.sum("monto", {
      where: {
        created_at: { [Op.gte]: startOfDay(fecha) },
        estado: "activo"
      }
    });

    resultados[key] = {
      ingresos: ventas || 0,
      egresos: egresos || 0
    };
  }

  // 🔹 Totales generales
  const totalCategorias = await Categoria.count();
  const totalProductos = await Producto.count();
  const totalUsuarios = await Usuario.count();
  const totalRoles = await Rol.count();

  resultados.totales = {
    categorias: totalCategorias,
    productos: totalProductos,
    usuarios: totalUsuarios,
    roles: totalRoles
  };

  return resultados;
}

export default { getKpis };
