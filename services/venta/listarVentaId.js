import sequelize from "../../config/database.js";
import { Venta, DetalleVenta, Ticket } from "../../models/index.js";

 

export async function obtenerDetalleVentaService(id) {
  const venta = await Venta.findByPk(id, {
    include: [
      {
        model: DetalleVenta,
        include: [
          {
            model: Producto
          },
          {
            model: DetalleVentaLote,
             
          }
        ]
      },
      {
        model: Ticket
      }
    ]
  });

  if (!venta) {
    const error = new Error("Venta no encontrada");
    error.status = 404;
    throw error;
  }

  return venta;
}

