import sequelize from "../../config/database.js";
import { Venta, Caja, Ticket } from "../../models/index.js";
import { validarStock } from "./utils/validarStock.js";
import { descontarStock } from "./utils/descontarStock.js";

export async function crearVentaService(
  { carrito, subtotal, descuento, iva, total, cliente_nombre, observacion },
  usuario_id
) {
  const t = await sequelize.transaction();
  const start = Date.now();
  try {
    const cajaAbierta = await Caja.findOne({
      where: { usuario_id, estado: "abierta" },
      order: [["created_at", "DESC"]],
      transaction: t,
    });

    if (!cajaAbierta) throw { status: 400, message: "Debe abrir una caja primero." };

    await validarStock(carrito, t);
    console.log(`✔ Validación stock en ${Date.now() - start} ms`);

    const venta = await Venta.create({
      cliente_nombre,
      subtotal,
      descuento,
      iva,
      total,
      observacion,
      caja_id: cajaAbierta.id,
      usuario_id
    }, { transaction: t });

    console.log(`✔ Creación venta en ${Date.now() - start} ms`);

    await descontarStock(carrito, venta.id, t);
    console.log(`✔ Descuento stock y detalle en ${Date.now() - start} ms`);

    const numero_ticket = `TICKET-${venta.id}-${Date.now()}`;
    await Ticket.create({
      numero_ticket,
      venta_id: venta.id,
      usuario_id,
      estado: "vendido",
      observacion: `Venta vinculada #${venta.id}`
    }, { transaction: t });

    await t.commit();
    console.log(`✔ Ticket creado en ${Date.now() - start} ms`);

    return {
      success: true,
      message: `Venta completada. Ticket: ${numero_ticket}`,
      venta_id: venta.id,
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
}
