import {
  Producto,
  Venta,
  DetalleVenta,
  Categoria,
  HistorialProducto,
  StockMovimiento,
} from "../models/index.js";
import sequelize from "../config/database.js";
import { Op, fn, col, literal } from "sequelize";
import bwipjs from "bwip-js"; // Para generar códigos de barras

export async function crearProductoService({
  nombre,
  codigo_barra,
  categoria_id,
  precio_compra,
  precio_venta,
  unidad_medida,
  unidad_base,   // ✅ nuevo
  es_decimal,    // ✅ nuevo
  presentacion,
  stock,
  descuento,
  // ✅ campos mayoreo
  venta_mayoreo,
  precio_mayoreo,
  minimo_mayoreo,
  // ✅ campos promoción
  promocion,
  fecha_promocion,
  fecha_final_promocion,
  descuento_promocion,

}) {
  const t = await sequelize.transaction();
  try {
    if (!categoria_id) throw { status: 400, message: "La categoría es obligatoria." };

    const categoriaExiste = await Categoria.findByPk(categoria_id, { transaction: t });
    if (!categoriaExiste) throw { status: 400, message: "La categoría no existe." };

    if (precio_venta <= precio_compra) {
      throw { status: 400, message: "El precio de venta debe ser mayor que el de compra." };
    }

    const codigo = codigo_barra || `CB-${Date.now()}`;
    const existente = await Producto.findOne({ where: { codigo_barra: codigo }, transaction: t });
    if (existente) throw { status: 400, message: "Ya existe un producto con ese código." };

    const utilidad = precio_venta - precio_compra;

    const producto = await Producto.create(
      {
        nombre,
        codigo_barra: codigo,
        categoria_id,
        precio_compra,
        precio_venta,
        utilidad,
        descuento: descuento || 0.0,
        unidad_medida: unidad_medida || null,
        unidad_base: unidad_base || unidad_medida || 'unidad',
        es_decimal: es_decimal || false,
        presentacion: presentacion || null,
        stock: stock || 0,
        // ✅ mayoreo
        venta_mayoreo: venta_mayoreo || false,
        precio_mayoreo: precio_mayoreo || null,
        minimo_mayoreo: minimo_mayoreo || null,
        // ✅ promoción
        promocion: promocion || false,
        fecha_promocion: fecha_promocion || null,
        fecha_final_promocion: fecha_final_promocion || null,
        descuento_promocion: descuento_promocion || null,
      },
      { transaction: t }
    );

    await t.commit();
    return producto;
  } catch (error) {
    await t.rollback();
    throw error;
  }
}


 
export async function editarProductoService(id, data) {
  const t = await sequelize.transaction();
  try {
    const producto = await Producto.findByPk(id, { transaction: t });
    if (!producto) throw { status: 404, message: "Producto no encontrado." };

    // === VALIDACIONES BÁSICAS ===
    if (data.codigo_barra && data.codigo_barra !== producto.codigo_barra) {
      const existeOtro = await Producto.findOne({
        where: {
          codigo_barra: data.codigo_barra,
          id: { [Op.ne]: id },
        },
        transaction: t,
      });
      if (existeOtro) {
        throw { status: 400, message: "Ya existe otro producto con ese código de barra." };
      }
    }

    if (data.precio_compra !== undefined && (typeof data.precio_compra !== "number" || data.precio_compra <= 0)) {
      throw { status: 400, message: "El precio de compra debe ser un número mayor a cero." };
    }

    if (data.precio_venta !== undefined && (typeof data.precio_venta !== "number" || data.precio_venta <= 0)) {
      throw { status: 400, message: "El precio de venta debe ser un número mayor a cero." };
    }

    if (data.precio_compra !== undefined && data.precio_venta !== undefined && data.precio_venta <= data.precio_compra) {
      throw { status: 400, message: "El precio de venta debe ser mayor que el de compra." };
    }

    if (data.stock !== undefined && (typeof data.stock !== "number" || data.stock < 0)) {
      throw { status: 400, message: "El stock debe ser un número mayor o igual a cero." };
    }

    if (data.descuento !== undefined && (data.descuento < 0 || data.descuento > 100)) {
      throw { status: 400, message: "El descuento debe estar entre 0 y 100%." };
    }

    // === VALIDACIONES UNIDAD Y DECIMALIDAD ===
    if (data.unidad_base && typeof data.unidad_base !== "string") {
      throw { status: 400, message: "La unidad base debe ser un texto válido." };
    }

    if (data.es_decimal !== undefined && typeof data.es_decimal !== "boolean") {
      throw { status: 400, message: "El campo 'es_decimal' debe ser verdadero o falso." };
    }

    // === VALIDACIONES MAYOREO ===
    if (data.venta_mayoreo !== undefined && typeof data.venta_mayoreo !== "boolean") {
      throw { status: 400, message: "El campo 'venta_mayoreo' debe ser verdadero o falso." };
    }

    if (data.precio_mayoreo !== undefined && data.precio_mayoreo !== null && (typeof data.precio_mayoreo !== "number" || data.precio_mayoreo <= 0)) {
      throw { status: 400, message: "El precio de mayoreo debe ser un número mayor a cero o null." };
    }

    if (data.minimo_mayoreo !== undefined && data.minimo_mayoreo !== null && (!Number.isInteger(data.minimo_mayoreo) || data.minimo_mayoreo <= 0)) {
      throw { status: 400, message: "El mínimo de mayoreo debe ser un número entero mayor a cero o null." };
    }

    // === VALIDACIONES PROMOCIÓN ===
    if (data.promocion !== undefined && typeof data.promocion !== "boolean") {
      throw { status: 400, message: "El campo 'promocion' debe ser verdadero o falso." };
    }

    if (data.fecha_promocion !== undefined && data.fecha_promocion !== null && isNaN(new Date(data.fecha_promocion).getTime())) {
      throw { status: 400, message: "La fecha de inicio de promoción no es válida." };
    }

    if (data.fecha_final_promocion !== undefined && data.fecha_final_promocion !== null && isNaN(new Date(data.fecha_final_promocion).getTime())) {
      throw { status: 400, message: "La fecha final de promoción no es válida." };
    }

    // === VALIDACIÓN descuento_promocion ===
    if (data.descuento_promocion !== undefined && (typeof data.descuento_promocion !== "number" || data.descuento_promocion < 0 || data.descuento_promocion > 100)) {
      throw { status: 400, message: "El descuento de promoción debe ser un número entre 0 y 100%." };
    }

    // === GUARDAR VALORES ANTERIORES PARA HISTORIAL ===
    const valoresAnteriores = {
      precio_compra: producto.precio_compra,
      precio_venta: producto.precio_venta,
      descuento: producto.descuento,
    };

    // === CAMPOS PERMITIDOS A ACTUALIZAR ===
    const campos = [
      "nombre",
      "codigo_barra",
      "categoria_id",
      "precio_compra",
      "precio_venta",
      "stock",
      "unidad_medida",
      "unidad_base",
      "es_decimal",
      "presentacion",
      "descuento",
      // mayoreo
      "venta_mayoreo",
      "precio_mayoreo",
      "minimo_mayoreo",
      // promoción
      "promocion",
      "fecha_promocion",
      "fecha_final_promocion",
      "descuento_promocion", // ✅ nuevo
    ];

    for (const campo of campos) {
      if (campo in data) {
        // Campos opcionales vacíos se guardan como null
        if (["codigo_barra", "unidad_medida", "presentacion", "categoria_id", "precio_mayoreo", "minimo_mayoreo", "fecha_promocion", "fecha_final_promocion"].includes(campo) && !data[campo]) {
          producto[campo] = null;
        } else {
          producto[campo] = data[campo];
        }
      }
    }

    // === RECALCULAR UTILIDAD ===
    producto.utilidad = producto.precio_venta - producto.precio_compra;

    // === MONITOREAR CAMBIOS EN PRECIO Y DESCUENTO ===
    const camposAMonitorear = ["precio_compra", "precio_venta", "descuento"];
    const cambios = [];
    for (const campo of camposAMonitorear) {
      if (campo in data && data[campo] !== valoresAnteriores[campo]) {
        cambios.push({
          producto_id: producto.id,
          campo,
          valor_anterior: valoresAnteriores[campo],
          valor_nuevo: data[campo],
          usuario_id: data.usuario_id || null,
        });
      }
    }

    // === GUARDAR CAMBIOS ===
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


// Servicio para generar código de barras único
export async function generarCodigoBarra() {
  let codigo;
  let intento = 0;

  do {
    // Ejemplo simple: un número de 9 dígitos
    codigo = (111111111 + Math.floor(Math.random() * 888888888)).toString();

    const existente = await Producto.findOne({
      where: { codigo_barra: codigo },
    });
    if (!existente) break;

    intento++;
    if (intento > 50)
      throw { status: 500, message: "No se pudo generar un código único" };
  } while (true);

  // Generar imagen del código de barras
  const barcodePNG = await bwipjs.toBuffer({
    bcid: "code128",
    text: codigo,
    scale: 3,
    height: 10,
    includetext: true,
    textxalign: "center",
  });

  // Retornar el código y la imagen en base64
  return { codigo, barcodeBase64: barcodePNG.toString("base64") };
}

export async function agregarStockProducto(
  producto_id,
  cantidad,
  tipo_movimiento = "ajuste",
  observaciones = "",
  transaction = null
) {
  if (cantidad <= 0)
    throw { status: 400, message: "Cantidad debe ser mayor a 0" };

  const t = transaction || (await sequelize.transaction());
  try {
    const producto = await Producto.findByPk(producto_id, { transaction: t });
    if (!producto) throw { status: 404, message: "Producto no encontrado" };

    const stockAnterior = producto.stock;
    producto.stock += cantidad;
    await producto.save({ transaction: t });

    await StockMovimiento.create(
      {
        producto_id, // 👈 guardamos el producto
        tipo_movimiento,
        cantidad,
        stock_anterior: stockAnterior,
        stock_nuevo: producto.stock,
        referencia_tipo: "otro",
        referencia_id: null,
        observaciones,
      },
      { transaction: t }
    );

    if (!transaction) await t.commit();

    return {
      success: true,
      message: `Stock actualizado para el producto #${producto_id} - Nuevo stock: ${producto.stock}`,
      producto_id,
      stock_nuevo: producto.stock,
    };
  } catch (error) {
    if (!transaction) await t.rollback();
    throw error;
  }
}

export async function eliminarProductoService(id) {
  const producto = await Producto.findByPk(id);
  if (!producto) throw { status: 404, message: "Producto no encontrado" };

  const ventas = await Venta.count({
    include: [
      {
        model: DetalleVenta,
        where: { producto_id: id },
      },
    ],
  });

  if (ventas > 0) {
    throw {
      status: 400,
      message: "No se puede eliminar producto con ventas asociadas",
    };
  }

  await producto.destroy();
  return { message: "Producto eliminado correctamente" };
}

export async function listarProductosService(filtros = {}, paginacion = {}) {
  const where = {};

  if (filtros.busqueda) {
    where[Op.or] = [
      { nombre: { [Op.like]: `%${filtros.busqueda}%` } },
      { codigo_barra: { [Op.like]: `%${filtros.busqueda}%` } },
    ];
  }

  if (filtros.categoria_id) {
    where.categoria_id = filtros.categoria_id;
  }

  const { pagina = 1, limite = 300 } = paginacion;
  const offset = (pagina - 1) * limite;

  const { count, rows } = await Producto.findAndCountAll({
    where,
    limit: limite,
    offset,
    order: [["nombre", "ASC"]],
    include: [
      {
        model: Categoria,
        attributes: ["nombre"],
        as: "Categorium", // asegúrate que este alias coincida con tu modelo Sequelize
      },
    ],
  });

  return {
    total: count,
    productos: rows,
    pagina,
    paginas: Math.ceil(count / limite),
  };
}

export async function restarStockProducto(
  producto_id,
  cantidad,
  tipo_movimiento = "ajuste",
  observaciones = "",
  transaction = null
) {
  if (cantidad <= 0)
    throw { status: 400, message: "Cantidad debe ser mayor a 0" };

  const t = transaction || (await sequelize.transaction());
  try {
    const producto = await Producto.findByPk(producto_id, { transaction: t });
    if (!producto) throw { status: 404, message: "Producto no encontrado" };

    const stockAnterior = producto.stock;
    producto.stock -= cantidad;
    if (producto.stock < 0) producto.stock = 0;

    await producto.save({ transaction: t });

    await StockMovimiento.create(
      {
        producto_id, // 👈 guardamos el producto
        tipo_movimiento,
        cantidad,
        stock_anterior: stockAnterior,
        stock_nuevo: producto.stock,
        referencia_tipo: "otro",
        referencia_id: null,
        observaciones,
      },
      { transaction: t }
    );

    if (!transaction) await t.commit();

    return {
      success: true,
      message: `Stock actualizado para el producto #${producto_id} - Nuevo stock: ${producto.stock}`,
      producto_id,
      stock_nuevo: producto.stock,
    };
  } catch (error) {
    if (!transaction) await t.rollback();
    throw error;
  }
}

export async function obtenerProductoPorIdService(id) {
  const producto = await Producto.findByPk(id, {
    attributes: [
      "id",
      "nombre",
      "codigo_barra",
      "precio_compra",
      "precio_venta",
      "stock",
      "unidad_medida",
      "presentacion",
      "categoria_id",
    ],
    include: {
      model: Categoria,
      attributes: ["id", "nombre"],
    },
  });

  if (!producto) {
    throw { status: 404, message: "Producto no encontrado" };
  }

  return producto;
}

// Obtener productos más vendidos (paginados, últimos 30 días, con búsqueda opcional)
export const obtenerProductosMasVendidos = async (
  page = 1,
  limit = 300,
  search = ""
) => {
  try {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30);

    const offset = (page - 1) * limit;

    const productosMasVendidos = await DetalleVenta.findAll({
      attributes: [[fn("SUM", col("cantidad")), "cantidad_vendida"]],
      include: [
        {
          model: Producto,
          attributes: ["nombre", "stock"],
          where: search ? { nombre: { [Op.like]: `%${search}%` } } : undefined,
        },
        {
          model: Venta,
          attributes: [],
          required: true,
          where: {
            created_at: { [Op.gte]: fechaLimite },
          },
        },
      ],
      group: ["DetalleVenta.producto_id", "Producto.nombre", "Producto.stock"],
      order: [[literal("cantidad_vendida"), "DESC"]],
      limit,
      offset,
      raw: true,
    });

    return productosMasVendidos.map((item) => ({
      nombre: item["Producto.nombre"],
      cantidad_vendida: parseInt(item.cantidad_vendida, 10),
      stock_actual: item["Producto.stock"],
    }));
  } catch (error) {
    console.error("Error al obtener productos más vendidos:", error);
    throw new Error("No se pudo generar el reporte de ventas.");
  }
};

// Obtener productos menos vendidos (paginados, últimos 30 días, con búsqueda opcional)
export const obtenerProductosMenosVendidos = async (
  page = 1,
  limit = 300,
  search = ""
) => {
  try {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30);

    const offset = (page - 1) * limit;

    const productosMenosVendidos = await DetalleVenta.findAll({
      attributes: [[fn("SUM", col("cantidad")), "cantidad_vendida"]],
      include: [
        {
          model: Producto,
          attributes: ["nombre", "stock"],
          where: search ? { nombre: { [Op.like]: `%${search}%` } } : undefined,
        },
        {
          model: Venta,
          attributes: [],
          required: true,
          where: {
            created_at: { [Op.gte]: fechaLimite },
          },
        },
      ],
      group: ["DetalleVenta.producto_id", "Producto.nombre", "Producto.stock"],
      order: [[literal("cantidad_vendida"), "ASC"]],
      limit,
      offset,
      raw: true,
    });

    return productosMenosVendidos.map((item) => ({
      nombre: item["Producto.nombre"],
      cantidad_vendida: parseInt(item.cantidad_vendida, 10),
      stock_actual: item["Producto.stock"],
    }));
  } catch (error) {
    console.error("Error al obtener productos menos vendidos:", error);
    throw new Error(
      "No se pudo generar el reporte de productos menos vendidos."
    );
  }
};

// obtener todos los productos  que van cambiando su stock

export async function listarMovimientosStock({
  page = 1,
  limit = 300,
  busqueda = "",
  tipo_movimiento,
}) {
  const offset = (page - 1) * limit;

  // Condición principal para StockMovimiento (tipo_movimiento)
  const whereMovimiento = {};
  if (tipo_movimiento) {
    whereMovimiento.tipo_movimiento = tipo_movimiento;
  }

  // Condición para el modelo Producto (búsqueda por nombre)
  const whereProducto = {};
  if (busqueda) {
    whereProducto.nombre = { [Op.like]: `%${busqueda}%` };
  }

  const { count, rows } = await StockMovimiento.findAndCountAll({
    where: whereMovimiento,
    include: [
      {
        model: Producto,
        attributes: ["id", "nombre"],
        required: !!busqueda, // Usar 'required' para hacer un INNER JOIN si hay búsqueda
        where: whereProducto,
      },
    ],
    order: [["created_at", "DESC"]],
    limit,
    offset,
  });

  return {
    movimientos: rows,
    total: count,
    pagina: page,
    totalPaginas: Math.ceil(count / limit),
  };
}

export async function obtenerProductosTodos() {
  const productos = await Producto.findAll({
    attributes: [
      "id",
      "nombre",
      "codigo_barra",
      "precio_compra",
      "precio_venta",
      "stock",
      "unidad_medida",
      "presentacion",
      "descuento",
      "categoria_id",
    ],
    order: [["id", "ASC"]],
  });

  return productos;
}

export async function actualizarStockAuditadoService({ productos }) {
  const t = await sequelize.transaction();

  try {
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      throw {
        status: 400,
        message: "No se enviaron productos para actualizar.",
      };
    }

    const resultados = [];

    for (const prod of productos) {
      const { id, inventarioEncontrado, auditoria_inventario } = prod;

      // Buscar producto
      const producto = await Producto.findByPk(id, { transaction: t });
      if (!producto) {
        throw { status: 404, message: `El producto con ID ${id} no existe.` };
      }

      const stockAnterior = producto.stock;
      const stockNuevo = inventarioEncontrado;

      // Actualizar stock del producto
      await producto.update({ stock: stockNuevo }, { transaction: t });

      // Registrar movimiento de stock
      await StockMovimiento.create(
        {
          producto_id: producto.id,
          tipo_movimiento: "ajuste", // ✅ solo valores válidos
          cantidad: Math.abs(auditoria_inventario),
          descripcion:
            auditoria_inventario === 0
              ? "Stock auditado sin cambios"
              : auditoria_inventario > 0
              ? `Ajuste de stock (excedente de ${auditoria_inventario} unidad(es))`
              : `Ajuste de stock (faltante de ${Math.abs(
                  auditoria_inventario
                )} unidad(es))`,
          referencia_tipo: "ajuste",
          referencia_id: null,
          observaciones: "Auditoría de inventario",
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
        },
        { transaction: t }
      );
    }

    await t.commit();
    return { message: "Stock actualizado correctamente.", data: resultados };
  } catch (error) {
    await t.rollback();
    throw error;
  }
}
