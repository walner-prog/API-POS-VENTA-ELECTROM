import {
  Egreso,
  InventarioLote,
  Caja,
  Producto,
  Venta,
  Categoria,
  StockMovimiento
   
} from "../models/index.js";
import sequelize from "../config/database.js";
import { agregarStockProducto } from "./producto.service.js";

 

export async function registrarCompraService(data, usuario) {
  const t = await sequelize.transaction();
  try {
    if (!usuario || !usuario.id) throw { status: 401, message: "Usuario no autenticado" };

    const { referencia, fecha_compra, factura_imagen, productos, proveedor, caja_id } = data;

    if (!productos || !Array.isArray(productos) || productos.length === 0)
      throw { status: 400, message: "Debe incluir al menos un producto para la compra" };

    if (!proveedor) throw { status: 400, message: "Debe especificar un proveedor" };

    const caja = await Caja.findOne({ where: { id: caja_id, estado: "abierta", abierto_por: usuario.id }, transaction: t });
    if (!caja) throw { status: 400, message: "Caja no encontrada o cerrada para este usuario" };

    // Crear egreso sin depender de precios
    const egreso = await Egreso.create(
      {
        tipo: "compra_productos",
        descripcion: `Compra a proveedor ${referencia}`,
        monto: data.monto_total || 0, // opcional, puede ser 0 si no se registra el precio
        referencia: referencia || null,
        usuario_id: usuario.id,
        caja_id: caja.id,
        fecha: fecha_compra || new Date(),
        factura_imagen: factura_imagen || null,
      },
      { transaction: t }
    );

    for (const p of productos) {
      if (!p.nombre || !p.categoria_id || !p.cantidad || p.cantidad <= 0)
        throw { status: 400, message: `Producto inválido` };

      let producto = await Producto.findByPk(p.producto_id, { transaction: t });
      if (!producto) {
        const codigo = p.codigo_barra || `CB-${Date.now()}`;
        producto = await Producto.create(
          {
            nombre: p.nombre,
            codigo_barra: codigo,
            categoria_id: p.categoria_id,
            unidad_medida: p.unidad_medida || null,
            presentacion: p.presentacion || null,
            stock: 0,
          },
          { transaction: t }
        );
        p.producto_id = producto.id;
      }

      // Registrar lote
      await InventarioLote.create(
        {
          producto_id: p.producto_id,
          cantidad: p.cantidad,
          fecha_caducidad: p.fecha_caducidad || null,
          precio_compra: p.precio_compra || 0,
          proveedor,
          egreso_id: egreso.id,
        },
        { transaction: t }
      );

      // Registrar movimiento de stock
      const stockAnterior = producto.stock;
      const stockNuevo = stockAnterior + p.cantidad;
      await StockMovimiento.create(
        {
          tipo_movimiento: "compra",
          cantidad: p.cantidad,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          referencia_tipo: "egreso",
          referencia_id: egreso.id,
          observaciones: `Compra a proveedor ${proveedor}`,
        },
        { transaction: t }
      );

      // Actualizar stock
      await agregarStockProducto(p.producto_id, p.cantidad, t);
    }

    await t.commit();
    return { success: true, egreso_id: egreso.id, productos_registrados: productos.length, caja_id: caja.id };
  } catch (error) {
    if (t) await t.rollback();
    console.error("Error registrarCompraService:", error);
    throw { status: error.status || 500, message: error.message || "Error al registrar la compra" };
  }
}




// LISTAR COMPRA DE PRODUCTOS

export async function listarComprasService(filtros) {
  const { fecha_inicio, fecha_fin, proveedor } = filtros;

  const where = {};
  if (fecha_inicio && fecha_fin) {
    where.fecha = {
      [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)],
    };
  }
  if (proveedor) {
    where.proveedor = proveedor;
  }

  const compras = await Egreso.findAll({
    where: {
      tipo: "compra_producto",
      ...where,
    },
    include: [
      {
        model: InventarioLote,
      },
    ],
  });

  return compras;
}

export async function obtenerCompraPorIdService(id) {
  const compra = await Egreso.findOne({
    where: {
      id,
      tipo: "compra_producto",
    },
    include: [
      {
        model: InventarioLote,
      },
    ],
  });
  return compra;
}
