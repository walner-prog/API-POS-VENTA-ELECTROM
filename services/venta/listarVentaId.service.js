 
import { Venta, DetalleVenta, Ticket,Producto } from "../../models/index.js";

export async function obtenerDetalleVentaService(id) {
  const venta = await Venta.findByPk(id, {
    include: [
      {
        model: DetalleVenta,
        include: [
          {
            model: Producto
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

