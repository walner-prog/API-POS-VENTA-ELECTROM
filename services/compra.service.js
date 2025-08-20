import { Egreso, InventarioLote,Caja,  Producto, Venta, Categoria } from '../models/index.js';
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

    // 2️⃣ Validar caja y fondos disponibles
    const caja = await Caja.findOne({ where: { id: caja_id, estado: 'abierta', abierto_por: usuario.id }, transaction: t });
    if (!caja) {
      throw { status: 400, message: "Caja no encontrada o cerrada para este usuario" };
    }

    const totalVentas = await Venta.sum('total', { where: { caja_id: caja.id, estado: 'completada' }, transaction: t }) || 0;
    const totalEgresos = await Egreso.sum('monto', { where: { caja_id: caja.id, estado: 'activo' }, transaction: t }) || 0;

    // 3️⃣ Validar productos y calcular monto total
    let montoTotal = 0;

    for (const p of productos) {
      // Validaciones básicas
      if (!p.nombre) throw { status: 400, message: "Cada producto debe tener un nombre" };
      if (!p.categoria_id) throw { status: 400, message: `Producto ${p.nombre} debe tener categoría` };
      if (typeof p.precio_compra !== 'number' || p.precio_compra <= 0) throw { status: 400, message: `Producto ${p.nombre} precio_compra inválido` };
      if (typeof p.precio_venta !== 'number' || p.precio_venta <= p.precio_compra) throw { status: 400, message: `Producto ${p.nombre} precio_venta debe ser mayor a precio_compra` };
      if (!p.cantidad || p.cantidad <= 0) throw { status: 400, message: `Producto ${p.nombre} cantidad debe ser mayor a cero` };

      // Validar categoría
      const categoria = await Categoria.findByPk(p.categoria_id, { transaction: t });
      if (!categoria) throw { status: 400, message: `Categoría con id ${p.categoria_id} no existe` };

      // Crear producto si no existe
      let producto = await Producto.findByPk(p.producto_id, { transaction: t });
      if (!producto) {
        const codigo = p.codigo_barra || `CB-${Date.now()}`;
        producto = await Producto.create({
          nombre: p.nombre,
          codigo_barra: codigo,
          categoria_id: p.categoria_id,
          precio_compra: p.precio_compra,
          precio_venta: p.precio_venta,
          utilidad: p.precio_venta - p.precio_compra,
          unidad_medida: p.unidad_medida || null,
          presentacion: p.presentacion || null,
          stock: 0
        }, { transaction: t });
        p.producto_id = producto.id; // asignamos id para el lote
      }

      montoTotal += p.cantidad * p.precio_compra;
    }

    const montoDisponible = parseFloat(caja.monto_inicial) + totalVentas - totalEgresos;
    if (montoTotal > montoDisponible) {
      const faltante = (montoTotal - montoDisponible).toFixed(2);
      throw {
        status: 400,
        message: `Fondos insuficientes en caja. Disponible: $${montoDisponible.toFixed(2)}, faltan $${faltante} para cubrir esta compra.`
      };
    }

    // 4️⃣ Crear egreso asociado a la caja
    const egreso = await Egreso.create({
      tipo: 'compra_productos',
      descripcion: `Compra a proveedor ${referencia}`,
      monto: montoTotal,
      referencia: referencia || null,
      usuario_id: usuario.id,
      caja_id: caja.id,
      fecha: fecha_compra || new Date(),
      factura_imagen: factura_imagen || null
    }, { transaction: t });

    // 5️⃣ Crear lotes y actualizar stock
    for (const p of productos) {
      await InventarioLote.create({
        producto_id: p.producto_id,
        cantidad: p.cantidad,
        fecha_caducidad: p.fecha_caducidad || null,
        precio_compra: p.precio_compra,
        proveedor,
        egreso_id: egreso.id
      }, { transaction: t });

      await agregarStockProducto(p.producto_id, p.cantidad, t);
    }

    // 6️⃣ Commit transacción
    await t.commit();

    return {
      success: true,
      egreso_id: egreso.id,
      monto_total: montoTotal,
      productos_registrados: productos.length,
      caja_id: caja.id
    };

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
