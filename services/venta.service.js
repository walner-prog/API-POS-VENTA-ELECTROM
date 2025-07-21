import sequelize from "../config/database.js";

import {
  Producto,
  DetalleVenta,
  DetalleVentaLote,
  Venta,
  Ticket,
  Caja,
  InventarioLote,
} from "../models/index.js";
import { Op } from "sequelize";

export async function crearVentaService(
  { carrito, subtotal, descuento, iva, total, cliente_nombre, observacion },
  usuario_id
) {
  const t = await sequelize.transaction();
  try {
    const cajaAbierta = await Caja.findOne({
      where: { usuario_id, estado: "abierta" },
      order: [["created_at", "DESC"]],
      transaction: t,
    });

    if (!cajaAbierta) {
      throw {
        status: 400,
        message: "Debe abrir una caja antes de realizar una venta.",
      };
    }

    // Validar stock para todo el carrito antes de crear venta
    for (const item of carrito) {
      const producto = await Producto.findByPk(item.producto_id, {
        transaction: t,
      });
      if (!producto) {
        throw {
          status: 404,
          message: `El producto con ID ${item.producto_id} no existe en el sistema.`,
        };
      }

      const lotes = await InventarioLote.findAll({
        where: {
          producto_id: item.producto_id,
          cantidad: { [Op.gt]: 0 },
        },
        transaction: t,
      });

      const stockTotal = lotes.reduce((acc, lote) => acc + lote.cantidad, 0);

      if (stockTotal <= 0) {
        throw {
          status: 400,
          message: `El producto "${producto.nombre}" no tiene stock disponible en ningún lote.`,
        };
      }

      if (stockTotal < item.cantidad) {
        const faltante = item.cantidad - stockTotal;
        throw {
          status: 400,
          message: `Stock insuficiente para "${producto.nombre}". El cliente necesita ${item.cantidad}, disponible ${stockTotal}. Faltan ${faltante} unidades.`,
        };
      }
    }

    // Crear venta
    const venta = await Venta.create(
      {
        cliente_nombre,
        subtotal,
        descuento,
        iva,
        total,
        observacion,
        caja_id: cajaAbierta.id,
        usuario_id,
      },
      { transaction: t }
    );

    for (const item of carrito) {
      const producto = await Producto.findByPk(item.producto_id, {
        transaction: t,
      });

      const lotes = await InventarioLote.findAll({
        where: {
          producto_id: item.producto_id,
          cantidad: { [Op.gt]: 0 },
        },
        order: [["id", "ASC"]], // Se puede ordenar por ID si se desea respetar orden FIFO sin usar fecha
        transaction: t,
      });

      let cantidadRestante = item.cantidad;

      const detalleVenta = await DetalleVenta.create(
        {
          venta_id: venta.id,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          total_linea: item.total_linea,
        },
        { transaction: t }
      );

      for (const lote of lotes) {
        if (cantidadRestante <= 0) break;

        const cantidadDescontar = Math.min(lote.cantidad, cantidadRestante);
        lote.cantidad -= cantidadDescontar;
        await lote.save({ transaction: t });

        await DetalleVentaLote.create(
          {
            detalle_venta_id: detalleVenta.id,
            inventario_lote_id: lote.id,
            cantidad: cantidadDescontar,
          },
          { transaction: t }
        );

        cantidadRestante -= cantidadDescontar;
      }

      // Actualizar stock global del producto
      producto.stock -= item.cantidad;
      await producto.save({ transaction: t });
    }

    const numero_ticket = `TICKET-${venta.id}-${Date.now()}`;
    await Ticket.create(
      {
        numero_ticket,
        venta_id: venta.id,
        usuario_id,
        estado: "vendido",
        observacion: `Venta vinculada #${venta.id}`,
      },
      { transaction: t }
    );

    await t.commit();

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

    const detalles = await DetalleVenta.findAll({
      where: { venta_id },
      transaction: t,
    });

    for (const detalle of detalles) {
      // 🔄 Reversar stock global
      const producto = await Producto.findByPk(detalle.producto_id, {
        transaction: t,
      });
      if (producto) {
        producto.stock += detalle.cantidad;
        await producto.save({ transaction: t });
      }

      // 🔄 Reversar stock por lotes
      const detalleLotes = await DetalleVentaLote.findAll({
        where: { detalle_venta_id: detalle.id },
        transaction: t,
      });

      for (const dl of detalleLotes) {
        const lote = await InventarioLote.findByPk(dl.inventario_lote_id, {
          transaction: t,
        });
        if (lote) {
          lote.cantidad += dl.cantidad;
          await lote.save({ transaction: t });
        }
      }
    }

    // Marcar ticket anulado
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
