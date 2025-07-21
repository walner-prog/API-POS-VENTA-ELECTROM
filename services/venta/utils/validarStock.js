import { Producto } from "../../../models/index.js";

export async function validarStock(carrito, transaction) {
  if (!carrito || carrito.length === 0) {
    throw { status: 400, message: "El carrito no puede estar vacío." };
  }

  for (const item of carrito) {
    const producto = await Producto.findByPk(item.producto_id, { transaction });

    if (!producto) {
      throw {
        status: 404,
        message: `El producto con ID ${item.producto_id} no existe.`,
      };
    }

    if (producto.stock < item.cantidad) {
      throw {
        status: 400,
        message: `Stock insuficiente para "${producto.nombre}". Requiere ${item.cantidad}, disponible ${producto.stock}.`,
      };
    }
  }
}
