import {
  Producto,
  Venta,
  DetalleVenta,
  Categoria,
  HistorialProducto
} from '../models/index.js'
import sequelize from '../config/database.js'
import { Op } from 'sequelize'

export async function registrarCompraService(data, usuario) {
  const t = await sequelize.transaction();
  try {
    if (!usuario || !usuario.id) throw { status: 401, message: "Usuario no autenticado" };

    const { referencia, fecha_compra, factura_imagen, productos, proveedor, caja_id } = data;

    if (!Array.isArray(productos) || productos.length === 0)
      throw { status: 400, message: "Debe incluir al menos un producto para la compra" };
    if (!proveedor) throw { status: 400, message: "Debe especificar un proveedor" };

    const caja = await Caja.findOne({
      where: { id: caja_id, estado: "abierta", abierto_por: usuario.id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!caja) throw { status: 400, message: "Caja no encontrada o cerrada para este usuario" };

    const totalVentas =
      (await Venta.sum("total", { where: { caja_id: caja.id, estado: "completada" }, transaction: t })) || 0;
    const totalEgresos =
      (await Egreso.sum("monto", { where: { caja_id: caja.id, estado: "activo" }, transaction: t })) || 0;

    // helper para redondear y asegurar números
    const to2 = (v) => {
      const n = parseFloat(v);
      if (!Number.isFinite(n)) throw { status: 400, message: "Valores numéricos inválidos en productos" };
      return parseFloat(n.toFixed(2));
    };

    let montoTotal = 0;

    for (const p of productos) {
      // Validaciones de entrada
      if (!p.nombre) throw { status: 400, message: "Cada producto debe tener un nombre" };
      if (!p.categoria_id) throw { status: 400, message: `Producto ${p.nombre} debe tener categoría` };
      if (!p.cantidad || p.cantidad <= 0)
        throw { status: 400, message: `Producto ${p.nombre} cantidad debe ser mayor a cero` };

      const precioCompraNuevo = to2(p.precio_compra);
      const precioVentaNuevo  = to2(p.precio_venta);
      if (precioVentaNuevo <= precioCompraNuevo)
        throw { status: 400, message: `Producto ${p.nombre} precio_venta debe ser mayor a precio_compra` };

      // Validar categoría (solo asegura que exista)
      const categoria = await Categoria.findByPk(p.categoria_id, { transaction: t });
      if (!categoria) throw { status: 400, message: `Categoría con id ${p.categoria_id} no existe` };

      // Buscar producto por ID
      let producto = null;
      if (p.producto_id) producto = await Producto.findByPk(p.producto_id, { transaction: t });

      if (!producto) {
        // Crear producto nuevo
        const codigo = p.codigo_barra || `CB-${Date.now()}`;
        producto = await Producto.create(
          {
            nombre: p.nombre,
            codigo_barra: codigo,
            categoria_id: p.categoria_id,
            precio_compra: precioCompraNuevo,
            precio_venta: precioVentaNuevo,
            utilidad: to2(precioVentaNuevo - precioCompraNuevo),
            unidad_medida: p.unidad_medida || null,
            presentacion: p.presentacion || null,
            stock: 0,
          },
          { transaction: t }
        );
        p.producto_id = producto.id;

        // Historial inicial
        await HistorialProducto.bulkCreate(
          [
            {
              producto_id: producto.id,
              campo: "precio_compra",
              valor_anterior: 0,
              valor_nuevo: precioCompraNuevo,
              usuario_id: usuario.id,
            },
            {
              producto_id: producto.id,
              campo: "precio_venta",
              valor_anterior: 0,
              valor_nuevo: precioVentaNuevo,
              usuario_id: usuario.id,
            },
            {
              producto_id: producto.id,
              campo: "utilidad",
              valor_anterior: 0,
              valor_nuevo: to2(precioVentaNuevo - precioCompraNuevo),
              usuario_id: usuario.id,
            },
          ],
          { transaction: t }
        );
      } else {
        // Producto existente → comparar como números
        const precioCompraActual = to2(producto.precio_compra);
        const precioVentaActual  = to2(producto.precio_venta);
        const utilidadActual     = to2(producto.utilidad);
        const nuevaUtilidad      = to2(precioVentaNuevo - precioCompraNuevo);

        const cambios = [];
        if (precioCompraActual !== precioCompraNuevo) {
          cambios.push({
            producto_id: producto.id,
            campo: "precio_compra",
            valor_anterior: precioCompraActual,
            valor_nuevo: precioCompraNuevo,
            usuario_id: usuario.id,
          });
        }
        if (precioVentaActual !== precioVentaNuevo) {
          cambios.push({
            producto_id: producto.id,
            campo: "precio_venta",
            valor_anterior: precioVentaActual,
            valor_nuevo: precioVentaNuevo,
            usuario_id: usuario.id,
          });
        }
        if (utilidadActual !== nuevaUtilidad) {
          cambios.push({
            producto_id: producto.id,
            campo: "utilidad",
            valor_anterior: utilidadActual,
            valor_nuevo: nuevaUtilidad,
            usuario_id: usuario.id,
          });
        }
        if (cambios.length) {
          await HistorialProducto.bulkCreate(cambios, { transaction: t });
        }

        // ⚠️ Forzar UPDATE a nivel tabla (evita heurística de "no cambió")
        await Producto.update(
          {
            precio_compra: precioCompraNuevo,
            precio_venta:  precioVentaNuevo,
            utilidad:      nuevaUtilidad,
          },
          { where: { id: producto.id }, transaction: t }
        );

        // asegurar que el id quede para el lote
        p.producto_id = producto.id;
      }

      montoTotal += to2(p.cantidad) * to2(p.precio_compra);
    }

    // Fondos disponibles
    const montoDisponible = to2(parseFloat(caja.monto_inicial) + totalVentas - totalEgresos);
    if (montoTotal > montoDisponible) {
      const faltante = (montoTotal - montoDisponible).toFixed(2);
      throw {
        status: 400,
        message: `Fondos insuficientes en caja. Disponible: $${montoDisponible.toFixed(2)}, faltan $${faltante} para cubrir esta compra.`,
      };
    }

    // Egreso
    const egreso = await Egreso.create(
      {
        tipo: "compra_productos",
        descripcion: `Compra a proveedor ${referencia}`,
        monto: to2(montoTotal),
        referencia: referencia || null,
        usuario_id: usuario.id,
        caja_id: caja.id,
        fecha: fecha_compra || new Date(),
        factura_imagen: factura_imagen || null,
      },
      { transaction: t }
    );

    // Lotes + stock
    for (const p of productos) {
      await InventarioLote.create(
        {
          producto_id: p.producto_id,
          cantidad: to2(p.cantidad),
          fecha_caducidad: p.fecha_caducidad || null,
          precio_compra: to2(p.precio_compra),
          proveedor,
          egreso_id: egreso.id,
        },
        { transaction: t }
      );
      await agregarStockProducto(p.producto_id, p.cantidad, t);
    }

    await t.commit();

    return {
      success: true,
      egreso_id: egreso.id,
      monto_total: to2(montoTotal),
      productos_registrados: productos.length,
      caja_id: caja.id,
    };
  } catch (error) {
    if (t) await t.rollback();
    console.error("Error registrarCompraService:", error);
    throw { status: error.status || 500, message: error.message || "Error al registrar la compra" };
  }
}



export async function agregarStockProducto(producto_id, cantidad, transaction = null) {
  if (cantidad <= 0)
    throw { status: 400, message: "Cantidad debe ser mayor a 0" };

  const options = transaction ? { transaction } : {};

  const producto = await Producto.findByPk(producto_id, options);
  if (!producto)
    throw { status: 404, message: "Producto no encontrado" };

  producto.stock += cantidad;
  await producto.save(options);

  return {
    success: true,
    message: `Stock actualizado para el producto #${producto_id} - Nuevo stock: ${producto.stock}`,
    producto_id,
    stock_nuevo: producto.stock
  };
}
 

export async function editarProductoService(id, data) {
  const t = await sequelize.transaction()
  try {
    const producto = await Producto.findByPk(id, { transaction: t })
    if (!producto) throw { status: 404, message: 'Producto no encontrado' }

    // Validaciones de código de barra
    if (data.codigo_barra && data.codigo_barra !== producto.codigo_barra) {
      const existeOtro = await Producto.findOne({
        where: {
          codigo_barra: data.codigo_barra,
          id: { [Op.ne]: id }
        },
        transaction: t
      })
      if (existeOtro) {
        throw {
          status: 400,
          message: 'Ya existe otro producto con ese código de barra.'
        }
      }
    }


    if (typeof data.precio_compra !== 'number' || data.precio_compra <= 0) {
  throw { status: 400, message: 'El precio de compra debe ser un número mayor a cero.' }
}

if (typeof data.precio_venta !== 'number' || data.precio_venta <= 0) {
  throw { status: 400, message: 'El precio de venta debe ser un número mayor a cero.' }
}

if (data.precio_venta <= data.precio_compra) {
  throw {
    status: 400,
    message: 'El precio de venta debe ser mayor que el precio de compra.'
  }
}

if (data.stock <= 0) {
  throw {
    status: 400,
    message: 'El stock debe ser mayor que cero.'
  }
}



    // Valores previos para monitoreo de cambios
    const valoresAnteriores = {
      precio_compra: producto.precio_compra,
      precio_venta: producto.precio_venta
    }

    // Actualizar campos excepto utilidad
    const campos = [
      'nombre',
      'codigo_barra',
      'categoria_id',
      'precio_compra',
      'precio_venta',
      'stock',
      'unidad_medida',
      'presentacion'
    ]
    for (const campo of campos) {
      if (campo in data) producto[campo] = data[campo] || null
    }

    // Recalcular utilidad con los valores actualizados
    producto.utilidad = producto.precio_venta - producto.precio_compra

    // Monitorear solo precio_compra y precio_venta para historial
    const camposAMonitorear = ['precio_compra', 'precio_venta']
    const cambios = []

    for (const campo of camposAMonitorear) {
      if (campo in data && data[campo] !== valoresAnteriores[campo]) {
        cambios.push({
          producto_id: producto.id,
          campo,
          valor_anterior: valoresAnteriores[campo],
          valor_nuevo: data[campo],
          usuario_id: data.usuario_id || null
        })
      }
    }

    // Guardar producto e historial en transacción
    await producto.save({ transaction: t })
    if (cambios.length > 0) {
      await HistorialProducto.bulkCreate(cambios, { transaction: t })
    }

    await t.commit()
    return producto
  } catch (error) {
    await t.rollback()
    throw error
  }
}



export async function eliminarProductoService (id) {
  const producto = await Producto.findByPk(id)
  if (!producto) throw { status: 404, message: 'Producto no encontrado' }

  const ventas = await Venta.count({
    include: [
      {
        model: DetalleVenta,
        where: { producto_id: id }
      }
    ]
  })

  if (ventas > 0) {
    throw {
      status: 400,
      message: 'No se puede eliminar producto con ventas asociadas'
    }
  }

  await producto.destroy()
  return { message: 'Producto eliminado correctamente' }
}

 

export async function listarProductosService(filtros = {}, paginacion = {}) {
  const where = {};

  if (filtros.busqueda) {
    where[Op.or] = [
      { nombre: { [Op.like]: `%${filtros.busqueda}%` } },
      { codigo_barra: { [Op.like]: `%${filtros.busqueda}%` } }
    ];
  }

  if (filtros.categoria_id) {
    where.categoria_id = filtros.categoria_id;
  }

  const { pagina = 1, limite = 10 } = paginacion;
  const offset = (pagina - 1) * limite;

  const { count, rows } = await Producto.findAndCountAll({
    where,
    limit: limite,
    offset,
    order: [["nombre", "ASC"]],
    include: [
      {
        model: Categoria,
        attributes: ['nombre'],
        as: 'Categorium'  // asegúrate que este alias coincida con tu modelo Sequelize
      }
    ]
  });

  return {
    total: count,
    productos: rows,
    pagina,
    paginas: Math.ceil(count / limite),
  };
}



export async function restarStockProducto(producto_id, cantidad) {
  const t = await sequelize.transaction();
  try {
    if (cantidad <= 0)
      throw { status: 400, message: "Cantidad debe ser mayor a 0" };

    const producto = await Producto.findByPk(producto_id, { transaction: t });
    if (!producto) throw { status: 404, message: "Producto no encontrado" };

    producto.stock -= cantidad;
    if (producto.stock < 0) producto.stock = 0; // Evitar stock negativo

    await producto.save({ transaction: t });

    await t.commit();
    return {
    success: true,
    message: `Stock actualizado para el producto #${producto_id} - Nuevo stock: ${producto.stock}`,
    producto_id,
    stock_nuevo: producto.stock
  };
  
  } catch (error) {
    await t.rollback();
    throw error;
  }
}



export async function obtenerProductoPorIdService(id) {
  const producto = await Producto.findByPk(id, {
    attributes: [
      'id',
      'nombre',
      'codigo_barra',
      'precio_compra',
      'precio_venta',
      'stock',
      'unidad_medida',
      'presentacion',
      'categoria_id'
    ],
    include: {
      model: Categoria,
      attributes: ['id', 'nombre']
    }
  });

  if (!producto) {
    throw { status: 404, message: 'Producto no encontrado' };
  }

  return producto;
}



 

export async function obtenerProductosTodos() {
 
  const productos = await Producto.findAll({
    attributes: ['id', 'nombre', 'codigo_barra', 'precio_compra', 'precio_venta', 'stock','unidad_medida', 'presentacion'],
    order: [['id', 'ASC']]
  });

  return productos;
}

