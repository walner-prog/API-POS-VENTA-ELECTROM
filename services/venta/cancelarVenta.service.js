import sequelize from "../../config/database.js";
import { Venta, Ticket } from "../../models/index.js";
import { reversarStock } from "./utils/reversarStock.js";

export async function cancelarVentaService(venta_id, motivo, usuario_id) {
  const t = await sequelize.transaction();
  try {
    const venta = await Venta.findByPk(venta_id, { transaction: t });
    if (!venta || venta.estado !== "completada") {
      throw {
        status: 404,
        message: "No se encontró la venta o ya está cancelada.",
      };
    }

    // ✅ Centralizá reversión dentro de la misma transacción
    await reversarStock(venta_id, t);

    const ticket = await Ticket.findOne({
      where: { venta_id },
      transaction: t,
    });
    if (ticket) {
      ticket.estado = "anulado";
      await ticket.save({ transaction: t });
    }

    venta.estado = "cancelada";
    venta.motivo_cancelacion = motivo;
    venta.cancelada_por = usuario_id;
    venta.cancelada_en = new Date();
    await venta.save({ transaction: t });

    await t.commit();

    return {
      success: true,
      message: `Venta #${venta_id} cancelada correctamente. El ticket ha sido anulado.`,
      venta_id,
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

