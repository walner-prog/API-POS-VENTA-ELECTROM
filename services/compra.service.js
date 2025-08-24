import {
  Egreso,
  InventarioLote,
  Caja,
  Producto,
  Venta,
  StockMovimiento,
  Usuario,
} from "../models/index.js";
import sequelize from "../config/database.js";
import { agregarStockProducto, restarStockProducto } from "./producto.service.js";
import { Op } from "sequelize";

export async function registrarCompraService(data, usuario) {
  const t = await sequelize.transaction();
  try {
    if (!usuario || !usuario.id) {
      throw { status: 401, message: "Usuario no autenticado" };
    }

    const {
      referencia,
      fecha_compra,
      factura_imagen,
      productos,
      proveedor,
    } = data;

    // --- Validaciones de datos de entrada ---
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      throw {
        status: 400,
        message: "Debe incluir al menos un producto para la compra",
      };
    }
    if (!proveedor) {
      throw { status: 400, message: "Debe especificar un proveedor" };
    }

    // 1️⃣ VALIDACIÓN DE LA CAJA
    const caja = await Caja.findOne({
      where: { estado: "abierta", abierto_por: usuario.id },
      transaction: t,
    });
    if (!caja) {
      throw {
        status: 400,
        message:
          "No hay una caja abierta para este usuario. Inicie una caja para registrar la compra.",
      };
    }

    // 🔹 Calcular monto_total en base a los productos
    let monto_total = 0;

    // 2️⃣ VALIDACIÓN DE PRODUCTOS Y CÁLCULO DE TOTAL
    for (const p of productos) {
      let producto = await Producto.findByPk(p.producto_id, { transaction: t });

      if (!producto) {
        // Producto nuevo → requiere precio_compra y precio_venta
        if (!p.precio_compra || !p.precio_venta) {
          throw {
            status: 400,
            message:
              "Precio de compra y venta son requeridos para productos nuevos",
          };
        }
      } else {
        // Producto existente → tomar precio de compra de BD
        p.precio_compra = producto.precio_compra;
      }

      if (!p.precio_compra) {
        throw {
          status: 400,
          message: `El producto ${p.nombre} no tiene precio de compra definido`,
        };
      }

      const subtotal = parseFloat(p.precio_compra) * parseFloat(p.cantidad);
      p.precio_total_producto = subtotal;
      monto_total += subtotal;
    }

    // 3️⃣ VALIDACIÓN DE FONDOS
    const totalVentas =
      (await Venta.sum("total", {
        where: { caja_id: caja.id, estado: "completada" },
        transaction: t,
      })) || 0;
    const totalEgresos =
      (await Egreso.sum("monto", {
        where: { caja_id: caja.id, estado: "activo" },
        transaction: t,
      })) || 0;
    const montoDisponible =
      parseFloat(caja.monto_inicial) + totalVentas - totalEgresos;

    if (monto_total > montoDisponible) {
      const faltante = (monto_total - montoDisponible).toFixed(2);
      throw {
        status: 400,
        message: `Fondos insuficientes en caja. Disponible: $${montoDisponible.toFixed(
          2
        )}, faltan $${faltante}`,
      };
    }

    // 4️⃣ Calcular unidades gratis y valor de ahorro
    let unidades_gratis_total = 0;
    let valor_ahorro_total = 0;

    for (const p of productos) {
      if (p.unidades_gratis && p.unidades_gratis > 0) {
        unidades_gratis_total += p.unidades_gratis;
        const ahorroProducto =
          (p.precio_total_producto / p.cantidad) * p.unidades_gratis;
        valor_ahorro_total += ahorroProducto;
      }
    }

    // 5️⃣ CREAR EGRESO
    const egreso = await Egreso.create(
      {
        tipo: "compra_productos",
        descripcion: `Compra a proveedor ${referencia}`,
        monto: monto_total,
        referencia: referencia || null,
        usuario_id: usuario.id,
        caja_id: caja.id,
        fecha: fecha_compra || new Date(),
        factura_imagen: factura_imagen || null,
        unidades_gratis_total,
        valor_ahorro_total,
      },
      { transaction: t }
    );

    // 6️⃣ REGISTRAR PRODUCTOS, LOTES Y MOVIMIENTOS
    const detalleProductos = [];

    for (const p of productos) {
      let producto = await Producto.findByPk(p.producto_id, { transaction: t });

      if (!producto) {
        // Producto nuevo
        const utilidad =
          parseFloat(p.precio_venta) - parseFloat(p.precio_compra);

        const codigo = p.codigo_barra || `CB-${Date.now()}`;
        producto = await Producto.create(
          {
            nombre: p.nombre,
            codigo_barra: codigo,
            categoria_id: p.categoria_id,
            precio_compra: p.precio_compra,
            precio_venta: p.precio_venta,
            utilidad: utilidad,
            unidad_medida: p.unidad_medida || null,
            presentacion: p.presentacion || null,
            stock: 0,
          },
          { transaction: t }
        );
        p.producto_id = producto.id;
      }

      const cantidadTotal = p.cantidad + (p.unidades_gratis || 0);

      await InventarioLote.create(
        {
          producto_id: p.producto_id,
          cantidad: cantidadTotal,
          fecha_caducidad: p.fecha_caducidad || null,
          precio_compra: p.precio_compra,
          proveedor,
          egreso_id: egreso.id,
        },
        { transaction: t }
      );

      await agregarStockProducto(
        p.producto_id,
        cantidadTotal,
        "compra",
        `Compra a proveedor ${proveedor}`,
        t
      );

      const ahorroProducto = p.unidades_gratis
        ? (p.precio_total_producto / p.cantidad) * p.unidades_gratis
        : 0;

      detalleProductos.push({
        producto_id: p.producto_id,
        nombre: p.nombre,
        categoria_id: p.categoria_id,
        cantidad_comprada: p.cantidad,
        unidades_gratis: p.unidades_gratis || 0,
        cantidad_total: cantidadTotal,
        precio_total: p.precio_total_producto,
        ahorro: ahorroProducto,
        fecha_caducidad: p.fecha_caducidad || null,
      });
    }

    await t.commit();

    return {
      success: true,
      egreso_id: egreso.id,
      caja_id: caja.id,
      monto_total,
      unidades_gratis_total,
      valor_ahorro_total,
      productos_registrados: productos.length,
      detalle_productos: detalleProductos,
    };
  } catch (error) {
    if (t) await t.rollback();
    console.error("Error registrarCompraService:", error);
    throw {
      status: error.status || 500,
      message: error.message || "Error al registrar la compra",
    };
  }
}



// LISTAR COMPRA DE PRODUCTOS

export async function listarComprasService(query) {
  try {
    const { proveedor, limite = 10, pagina = 1, fecha, busqueda } = query;

    const where = { tipo: "compra_productos" };

    // Filtro proveedor
    if (proveedor) {
      where.proveedor = { [Op.like]: `%${proveedor}%` };
    }

    // Filtro por fecha única en UTC
    // Filtro por fecha única
    if (fecha) {
      const [year, month, day] = fecha.split("-").map(Number);

      // Crear un objeto de fecha para el inicio del día en la zona horaria local
      const inicio = new Date(year, month - 1, day, 0, 0, 0, 0);

      // Crear un objeto de fecha para el final del día en la zona horaria local
      const fin = new Date(year, month - 1, day, 23, 59, 59, 999);

      where.created_at = { [Op.between]: [inicio, fin] };
    }

    // Búsqueda general (referencia, proveedor o productos)
    let productoWhere = {};
    if (busqueda) {
      // referencia o proveedor
      where[Op.or] = [
        { referencia: { [Op.like]: `%${busqueda}%` } },
        { proveedor: { [Op.like]: `%${busqueda}%` } },
      ];

      // búsqueda en productos relacionados
      productoWhere = {
        [Op.or]: [
          {
            "$InventarioLotes.Producto.nombre$": { [Op.like]: `%${busqueda}%` },
          },
        ],
      };
    }

    const { rows: compras, count: total } = await Egreso.findAndCountAll({
      where: { ...where, ...productoWhere },
      include: [
        {
          model: InventarioLote,
          include: [{ model: Producto }],
        },
        { model: Usuario },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limite),
      offset: (parseInt(pagina) - 1) * parseInt(limite),
      distinct: true,
    });

    return {
      total,
      pagina: parseInt(pagina),
      limite: parseInt(limite),
      total_paginas: Math.ceil(total / limite),
      data: compras.map((c) => ({
        egreso_id: c.id,
        referencia: c.referencia,
        proveedor: c.proveedor,
        created_at: c.created_at,
        monto: c.monto,
        unidades_gratis_total: c.unidades_gratis_total,
        valor_ahorro_total: c.valor_ahorro_total,
        caja_id: c.caja_id,
        usuario: c.Usuario
          ? { id: c.Usuario.id, nombre: c.Usuario.nombre }
          : null,
        productos: c.InventarioLotes.map((l) => ({
          producto_id: l.producto_id,
          nombre: l.Producto?.nombre || "",
          cantidad: l.cantidad,
          fecha_caducidad: l.fecha_caducidad || "NO se Registro",
        })),
      })),
    };
  } catch (error) {
    console.error("Error listarComprasService:", error);
    throw { status: 500, message: "Error al listar las compras" };
  }
}

export async function obtenerCompraPorIdService(id) {
  try {
    const compra = await Egreso.findOne({
      where: {
        id,
        tipo: "compra_productos", // asegúrate de que coincide con listarComprasService
      },
      include: [
        {
          model: InventarioLote,
          include: [{ model: Producto }],
        },
        {
          model: Usuario,
        },
      ],
    });

    if (!compra) return null;

    // Formatear la respuesta igual que listarComprasService
    return {
      egreso_id: compra.id,
      referencia: compra.referencia,
      proveedor: compra.proveedor,
      created_at: compra.created_at,
      monto: compra.monto,
      unidades_gratis_total: compra.unidades_gratis_total,
      valor_ahorro_total: compra.valor_ahorro_total,
      usuario: compra.Usuario
        ? { id: compra.Usuario.id, nombre: compra.Usuario.nombre }
        : null,
      productos: compra.InventarioLotes.map((l) => ({
        producto_id: l.producto_id,
        nombre: l.Producto?.nombre || "",
        cantidad: l.cantidad,
        fecha_caducidad: l.fecha_caducidad || "NO se Registro",
      })),
    };
  } catch (error) {
    console.error("Error obtenerCompraPorIdService:", error);
    throw { status: 500, message: "Error al obtener la compra" };
  }
}


export async function eliminarCompraService(egresoId, usuario) {
  const t = await sequelize.transaction();
  try {
     if (!usuario || !usuario.id) {
  console.log("usuario recibido:", usuario);
  throw { status: 401, message: "Usuario no autenticado" };
}


    // 1️⃣ Buscar el egreso
    const egreso = await Egreso.findOne({
      where: { id: egresoId, tipo: "compra_productos", estado: "activo" },
      transaction: t,
    });

    if (!egreso) {
      throw { status: 404, message: "Compra no encontrada o ya anulada" };
    }

    // 2️⃣ Buscar lotes asociados a esa compra
    const lotes = await InventarioLote.findAll({
      where: { egreso_id: egreso.id },
      transaction: t,
    });

    // 3️⃣ Revertir stock de cada producto
    for (const lote of lotes) {
      const producto = await Producto.findByPk(lote.producto_id, { transaction: t });
      if (!producto) continue;

      await restarStockProducto(
        lote.producto_id,
        lote.cantidad,
        "anulación_compra",
        `Anulación de compra #${egreso.id}`,
        t
      );

      // Opcional: marcar lote como anulado
      lote.estado = "anulado";
      await lote.save({ transaction: t });
    }

    // 4️⃣ Marcar egreso como anulado
    egreso.estado = "anulado";
    egreso.anulado_por = usuario.id;
    egreso.fecha_anulacion = new Date();
    await egreso.save({ transaction: t });

    await t.commit();

    return {
      success: true,
      message: `Compra #${egreso.id} anulada correctamente`,
      lotes_afectados: lotes.length,
    };
  } catch (error) {
    if (t) await t.rollback();
    console.error("Error eliminarCompraService:", error);
    throw {
      status: error.status || 500,
      message: error.message || "Error al eliminar la compra",
    };
  }
}

