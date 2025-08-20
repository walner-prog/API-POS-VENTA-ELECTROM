import { Egreso, InventarioLote } from '../models/index.js';
import sequelize from '../config/database.js';
import { agregarStockProducto } from './producto.service.js';

export async function registrarCompraService(data, usuario) {
  const t = await sequelize.transaction();
  try {
    const { proveedor, fecha_compra, factura_imagen, productos } = data;

    const montoTotal = productos.reduce(
      (sum, p) => sum + (p.cantidad * p.precio_unitario),
      0
    );

    // 1. Crear egreso
    const egreso = await Egreso.create({
      tipo: 'compra_producto',
      descripcion: `Compra a proveedor ${proveedor}`,
      monto: montoTotal,
      proveedor,
      usuario_id: usuario.id,
      fecha: fecha_compra || new Date(),
      factura_imagen: factura_imagen || null
    }, { transaction: t });

    // 2. Crear lotes y actualizar stock
    for (const p of productos) {
      await InventarioLote.create({
        producto_id: p.producto_id,
        cantidad: p.cantidad,
        fecha_caducidad: p.fecha_caducidad || null,
        precio_compra: p.precio_unitario,
        proveedor,
        egreso_id: egreso.id
      }, { transaction: t });

      await agregarStockProducto(p.producto_id, p.cantidad, t);
    }

    await t.commit();
    return { success: true, egreso_id: egreso.id, monto_total: montoTotal };

  } catch (error) {
    await t.rollback();
    throw error;
  }
}
