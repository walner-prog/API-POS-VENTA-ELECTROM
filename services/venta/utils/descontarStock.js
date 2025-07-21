import { Producto, DetalleVenta } from "../../../models/index.js";

export async function descontarStock(carrito, venta_id, transaction) {
  for (const item of carrito) {
    const producto = await Producto.findByPk(item.producto_id, { transaction, lock: transaction.LOCK.UPDATE });

    if (!producto) {
      throw { status: 404, message: `Producto ID ${item.producto_id} no encontrado` };
    }

    if (producto.stock < item.cantidad) {
      throw { status: 400, message: `Stock insuficiente para ${producto.nombre}` };
    }

    await DetalleVenta.create({
      venta_id,
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      total_linea: item.total_linea,
    }, { transaction });

    producto.stock -= item.cantidad;
    await producto.save({ transaction });
  }
}
