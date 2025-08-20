import { Egreso, InventarioLote } from '../models/index.js';
import sequelize from '../config/database.js';
import { agregarStockProducto } from './producto.service.js';
 

 

export async function registrarCompraService(data, usuario) {
  const t = await sequelize.transaction();
  try {
    // 1️⃣ Validaciones iniciales
    if (!usuario || !usuario.id) {
      throw { status: 401, message: "Usuario no autenticado" };
    }

    const { referencia, fecha_compra, factura_imagen, productos, proveedor, caja_id } = data;

    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      throw { status: 400, message: "Debe incluir al menos un producto para la compra" };
    }

    if (!proveedor) {
      throw { status: 400, message: "Debe especificar un proveedor" };
    }

    // Validar caja
    const caja = await Caja.findOne({ where: { id: caja_id, estado: 'abierta' } });
    if (!caja) {
      throw { status: 400, message: "Caja no encontrada o cerrada" };
    }

    // 2️⃣ Calcular monto total
    const montoTotal = productos.reduce((sum, p) => {
      if (!p.producto_id || !p.cantidad || !p.precio_unitario) {
        throw { status: 400, message: "Cada producto debe tener id, cantidad y precio_unitario" };
      }
      if (p.cantidad <= 0 || p.precio_unitario <= 0) {
        throw { status: 400, message: "Cantidad y precio_unitario deben ser mayores a cero" };
      }
      return sum + p.cantidad * p.precio_unitario;
    }, 0);

    // 3️⃣ Crear egreso asociado a la caja
    const egreso = await Egreso.create({
      tipo: 'compra_productos', // ⚠️ coincide con ENUM
      descripcion: `Compra a proveedor ${referencia}`,
      monto: montoTotal,
      referencia: referencia || null,
      usuario_id: usuario.id,
      caja_id: caja.id,
      fecha: fecha_compra || new Date(),
      factura_imagen: factura_imagen || null
    }, { transaction: t });

    // 4️⃣ Crear lotes y actualizar stock
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

    // 5️⃣ Commit transacción
    await t.commit();

    return {
      success: true,
      egreso_id: egreso.id,
      monto_total: montoTotal,
      productos_registrados: productos.length,
      caja_id: caja.id
    };

  } catch (error) {
    // Rollback seguro
    if (t) await t.rollback();
    console.error("Error registrarCompraService:", error);

    throw {
      status: error.status || 500,
      message: error.message || "Error al registrar la compra"
    };
  }
}



// LISTAR COMPRA DE PRODUCTOS 

export async function listarComprasService(filtros) {
  const { fecha_inicio, fecha_fin, proveedor } = filtros;

  const where = {};
  if (fecha_inicio && fecha_fin) {
    where.fecha = {
      [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)]
    };
  }
  if (proveedor) {
    where.proveedor = proveedor;
  }

  const compras = await Egreso.findAll({
    where: {
      tipo: 'compra_producto',
      ...where
    },
    include: [
      {
        model: InventarioLote
      }
    ]
  });

  return compras;
}

export async function obtenerCompraPorIdService(id) {
  const compra = await Egreso.findOne({
    where: {
      id,
      tipo: 'compra_producto'
    },
    include: [
      {
        model: InventarioLote
      }
    ]
  });
  return compra;
}
