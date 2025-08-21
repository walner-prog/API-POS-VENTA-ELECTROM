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
  stock,
  descuento
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
      descuento: descuento || 0.00,
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
  const t = await sequelize.transaction();
  try {
    const producto = await Producto.findByPk(id, { transaction: t });
    if (!producto) throw { status: 404, message: 'Producto no encontrado' };

    // Validaciones de código de barra
    if (data.codigo_barra && data.codigo_barra !== producto.codigo_barra) {
      const existeOtro = await Producto.findOne({
        where: {
          codigo_barra: data.codigo_barra,
          id: { [Op.ne]: id }
        },
        transaction: t
      });
      if (existeOtro) {
        throw { status: 400, message: 'Ya existe otro producto con ese código de barra.' };
      }
    }

    // Validaciones de precios
    if (typeof data.precio_compra !== 'number' || data.precio_compra <= 0) {
      throw { status: 400, message: 'El precio de compra debe ser un número mayor a cero.' };
    }

    if (typeof data.precio_venta !== 'number' || data.precio_venta <= 0) {
      throw { status: 400, message: 'El precio de venta debe ser un número mayor a cero.' };
    }

    if (data.precio_venta <= data.precio_compra) {
      throw { status: 400, message: 'El precio de venta debe ser mayor que el precio de compra.' };
    }

    if (data.stock <= 0) {
      throw { status: 400, message: 'El stock debe ser mayor que cero.' };
    }

    if (data.descuento !== undefined && (data.descuento < 0 || data.descuento > 100)) {
      throw { status: 400, message: 'El descuento debe estar entre 0 y 100%' };
    }

    // Valores previos para monitoreo
    const valoresAnteriores = {
      precio_compra: producto.precio_compra,
      precio_venta: producto.precio_venta,
      descuento: producto.descuento
    };

    // Actualizar campos
    const campos = [
      'nombre',
      'codigo_barra',
      'categoria_id',
      'precio_compra',
      'precio_venta',
      'stock',
      'unidad_medida',
      'presentacion',
      'descuento' // Nuevo campo
    ];
    for (const campo of campos) {
      if (campo in data) producto[campo] = data[campo] || null;
    }

    // Recalcular utilidad con los valores actualizados
    producto.utilidad = producto.precio_venta - producto.precio_compra;

    // Monitorear cambios para historial
    const camposAMonitorear = ['precio_compra', 'precio_venta', 'descuento'];
    const cambios = [];
    for (const campo of camposAMonitorear) {
      if (campo in data && data[campo] !== valoresAnteriores[campo]) {
        cambios.push({
          producto_id: producto.id,
          campo,
          valor_anterior: valoresAnteriores[campo],
          valor_nuevo: data[campo],
          usuario_id: data.usuario_id || null
        });
      }
    }

    // Guardar producto e historial
    await producto.save({ transaction: t });
    if (cambios.length > 0) {
      await HistorialProducto.bulkCreate(cambios, { transaction: t });
    }

    await t.commit();
    return producto;
  } catch (error) {
    await t.rollback();
    throw error;
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

