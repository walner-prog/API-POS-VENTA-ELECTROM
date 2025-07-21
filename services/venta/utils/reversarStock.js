import { DetalleVenta, Producto, } from "../../../models/index.js";

export async function reversarStock(venta_id, transaction) {
  const detalles = await DetalleVenta.findAll({ where: { venta_id }, transaction });

  for (const detalle of detalles) {
    const producto = await Producto.findByPk(detalle.producto_id, { transaction });
    if (producto) {
      producto.stock += detalle.cantidad;
      await producto.save({ transaction });
    }
  }
}

