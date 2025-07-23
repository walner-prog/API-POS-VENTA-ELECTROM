import {
  Producto,
  Venta,
  DetalleVenta,
  Categoria,
  HistorialProducto
} from '../models/index.js'
import sequelize from '../config/database.js'
import { Op } from 'sequelize'

export async function crearProductoService({
  nombre,
  codigo_barra,
  categoria_id,
  precio_compra,
  precio_venta,
  unidad_medida,
  presentacion,
  stock  
}) {
  const t = await sequelize.transaction()
  try {
    if (!categoria_id) {
      throw {
        status: 400,
        message: 'La categoría es obligatoria para registrar el producto.'
      }
    }

    const categoriaExiste = await Categoria.findByPk(categoria_id, { transaction: t })
    if (!categoriaExiste) {
      throw {
        status: 400,
        message: 'La categoría seleccionada no existe. Por favor seleccione una válida.'
      }
    }

    if (typeof precio_compra !== 'number' || precio_compra <= 0) {
      throw { status: 400, message: 'El precio de compra debe ser un número mayor a cero.' }
    }

    if (typeof precio_venta !== 'number' || precio_venta <= 0) {
      throw { status: 400, message: 'El precio de venta debe ser un número mayor a cero.' }
    }

    if (precio_venta <= precio_compra) {
      throw {
        status: 400,
        message: 'El precio de venta debe ser mayor que el precio de compra.'
      }
    }

    if (stock <= 0) {
      throw {
        status: 400,
        message: 'El stock debe ser mayor que cero.'
      }
    }


    const codigo = codigo_barra || `CB-${Date.now()}`
    const existente = await Producto.findOne({
      where: { codigo_barra: codigo },
      transaction: t
    })
    if (existente) {
      throw {
        status: 400,
        message: 'Ya existe un producto con ese código de barra.'
      }
    }

    const utilidad = precio_venta - precio_compra

    const producto = await Producto.create({
      nombre,
      codigo_barra: codigo,
      categoria_id,
      precio_compra,
      precio_venta,
      utilidad,
      unidad_medida: unidad_medida || null,
      presentacion: presentacion || null,
      stock: stock  || 0
    }, { transaction: t })

    await t.commit()
    return producto
  } catch (error) {
    await t.rollback()
    throw error
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
  if (filtros.nombre) where.nombre = { [Op.like]: `%${filtros.nombre}%` };
  if (filtros.categoria_id) where.categoria_id = filtros.categoria_id;
  if (filtros.codigo_barra) where.codigo_barra = filtros.codigo_barra;

  const { pagina = 1, limite = 20 } = paginacion;
  const offset = (pagina - 1) * limite;

  const { count, rows } = await Producto.findAndCountAll({
    where,
    limit: limite,
    offset,
    order: [["nombre", "ASC"]],
    include: [
      {
        model: Categoria,
        attributes: ['nombre'] // 👈 esto incluye el nombre de la categoría
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





export async function obtenerHistorialProducto(id) {
  const historial = await HistorialProducto.findAll({
    where: { producto_id: id },
    order: [['createdAt', 'DESC']]
  });
  return historial;
}

