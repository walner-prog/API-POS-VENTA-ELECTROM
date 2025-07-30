import sequelize from "../config/database.js";
import { Op } from 'sequelize'
import { Caja, Venta, Egreso, DetalleVenta, Producto,Usuario } from '../models/index.js'
 

export async function abrirCajaService({ monto_inicial, observacion, nombre }, usuario_id_cajero) {
  const t = await sequelize.transaction();
  try {

      // monto debe ser mayor a 0
    if (monto_inicial <= 0) {
      throw { status: 400, message: 'El monto inicial debe ser mayor a 0.' };
    }

    if (monto_inicial == null) {
      throw { status: 400, message: 'Debe indicar un monto inicial para abrir la caja.' };
    }

    // ✅ Convertimos a número antes de validar
    monto_inicial = Number(monto_inicial);

    if (isNaN(monto_inicial)) {
      throw { status: 400, message: "El monto inicial es obligatorio y debe ser un número válido" };
    }

    const cajeroUser = await Usuario.findByPk(usuario_id_cajero, { transaction: t });
    if (!cajeroUser) {
      throw {
        status: 404,
        message: 'No se encontró el usuario especificado. Verifique el usuario antes de abrir la caja.'
      };
    }

    const cajaAbierta = await Caja.findOne({
      where: { usuario_id: usuario_id_cajero, estado: 'abierta' },
      transaction: t
    });

    if (cajaAbierta) {
      throw {
        status: 400,
        message: `El usuario ${cajeroUser.nombre} ya tiene una caja abierta. Cierre la caja actual antes de abrir una nueva.`
      };
    }

    const now = new Date();
    const hora_apertura = now.toTimeString().split(' ')[0];

    const caja = await Caja.create({
      nombre,
      monto_inicial,
      observacion,
      usuario_id: usuario_id_cajero,
      abierto_por: usuario_id_cajero,
      hora_apertura
    }, { transaction: t });

    await t.commit();

    const fechaFormateada = now.toLocaleString('es-NI', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      hour12: true
    });

    return {
      success: true,
      message: `La caja "${caja.nombre}" se abrió correctamente para el usuario ${cajeroUser.nombre} con un monto inicial de ${parseFloat(caja.monto_inicial).toFixed(2)}. Hora de apertura: ${fechaFormateada}.`,
      caja: {
        id: caja.id,
        nombre: caja.nombre,
        monto_inicial: parseFloat(caja.monto_inicial).toFixed(2),
        hora_apertura: fechaFormateada
      }
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
}



export async function cerrarCajaService(caja_id, usuario_id) {
  const t = await sequelize.transaction();

  try {
    const caja = await Caja.findOne({ where: { id: caja_id, usuario_id, estado: 'abierta' }, transaction: t });
    if (!caja) throw { status: 404, message: 'Caja no encontrada o ya cerrada' };

    const ventas = await Venta.findAll({ where: { caja_id: caja.id, estado: 'completada' }, transaction: t });
    const totalVentas = ventas.reduce((acc, venta) => acc + parseFloat(venta.total), 0);

    const totalEgresos = await Egreso.sum('monto', {
      where: { caja_id: caja.id, estado: 'activo' },
      transaction: t
    }) || 0;

    const detalles = await DetalleVenta.findAll({
      include: [
        { model: Producto, attributes: ['precio_compra'] },
        { model: Venta, where: { caja_id: caja.id, estado: 'completada' }, attributes: [] }
      ],
      transaction: t
    });


    

    const total_precio_compra = detalles.reduce((acc, d) => acc + parseFloat(d.cantidad) * parseFloat(d.Producto.precio_compra), 0);
    const total_precio_venta = detalles.reduce((acc, d) => acc + parseFloat(d.total_linea), 0);
    const ganancia = total_precio_venta - total_precio_compra;

    const dineroFinal = parseFloat(caja.monto_inicial) + totalVentas - totalEgresos;

    caja.monto_final = dineroFinal;
    caja.estado = 'cerrada';
    caja.closed_at = new Date();

        const now = new Date();
    const hora_apertura = now.toTimeString().split(' ')[0];
    

    await caja.save({ transaction: t });

    await t.commit();

       const fechaFormateada = now.toLocaleString('es-NI', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      hour12: true
    });

    return {
      success: true,
      message: 'Caja cerrada correctamente.',
      cierre: {
      monto_inicial: caja.monto_inicial,
      total_ventas: totalVentas,
      total_egresos: totalEgresos,
      total_precio_compra,
      total_precio_venta,
      ganancia,
      cantidad_tickets: ventas.length,
      dinero_final: dineroFinal,
      hora_apertura: fechaFormateada,
      hora_cierre: caja.closed_at,
      usuario_id
      }
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
}




export async function listarCierresService(usuario_id, desde, hasta, pagina = 1, limite = 5) {
  const offset = (pagina - 1) * limite;

  const hace31Dias = new Date();
  hace31Dias.setDate(hace31Dias.getDate() - 31);

  const { count, rows } = await Caja.findAndCountAll({
     where: {
      usuario_id,
      estado: 'cerrada',
      closed_at: {
        [Op.gte]: hace31Dias
      }
    },
    order: [['closed_at', 'DESC']],
    limit: parseInt(limite),
    offset: parseInt(offset),
    include: [

       {
        model: Usuario, // Aquí se incluye el modelo Usuario
        attributes: ['id', 'nombre']
      },
  
      {
        model: Venta,
        where: { estado: 'completada' },
        required: false,
        attributes: ['id', 'total', 'estado']
      },
      {
        model: Egreso,
        where: { estado: 'activo' },
        required: false,
        attributes: ['id', 'monto', 'estado']
      }
    ]
  });

  const formatearHora = (hora) => {
  // Creamos una fecha ficticia con esa hora y la interpretamos en UTC
  return new Date(`1970-01-01T${hora}Z`).toLocaleTimeString('es-NI', {
    timeZone: 'America/Managua',
    hour12: true
  });
};


  // Mapeo con Promise.all para esperar todos los async
  const cierres = await Promise.all(rows.map(async caja => {
    const totalVentas = caja.Venta?.reduce((acc, v) => acc + parseFloat(v.total), 0) || 0;
    const totalEgresos = caja.Egresos?.reduce((acc, e) => acc + parseFloat(e.monto), 0) || 0;
    const dineroEsperado = parseFloat(caja.monto_inicial) + totalVentas - totalEgresos;

    // Obtener detalles de venta con producto incluido
    const detalles = await DetalleVenta.findAll({
      include: [
        { model: Producto, attributes: ['precio_compra'] },
        { model: Venta, where: { caja_id: caja.id, estado: 'completada' }, attributes: [] }
      ]
    });

    const total_precio_compra = detalles.reduce((acc, d) => {
      return acc + parseFloat(d.cantidad) * parseFloat(d.Producto.precio_compra);
    }, 0);

    const total_precio_venta = detalles.reduce((acc, d) => {
      return acc + parseFloat(d.total_linea);
    }, 0);

    const ganancia = total_precio_venta - total_precio_compra;

    return {
      id: caja.id,
      monto_inicial: caja.monto_inicial,
      monto_final: caja.monto_final,
      hora_apertura: formatearHora(caja.hora_apertura),
      hora_cierre: caja.closed_at,
      observacion: caja.observacion,
      total_ventas: totalVentas,
      total_egresos: totalEgresos,
      dinero_esperado: dineroEsperado,
      total_precio_compra,
      total_precio_venta,
      ganancia
    };
  }));

  return {
    success: true,
    cierres,
    total_paginas: Math.ceil(count / limite),
    total_registros: count,
    pagina: parseInt(pagina),
    message: cierres.length === 0 ? 'No hay cierres registrados en los últimos 31 días' : undefined
  };
}




export async function historialCierresService(usuario_id, desde, hasta, pagina = 1, limite = 5, estado) {
  const offset = (pagina - 1) * limite;

  const hoy = new Date();
  const hace31Dias = new Date();
  hace31Dias.setDate(hoy.getDate() - 31);

  // Validación fechas
  if (desde) {
    const fechaDesde = new Date(desde);
    if (fechaDesde < hace31Dias) {
      throw { status: 400, message: 'La fecha de inicio no puede ser anterior a los últimos 31 días.' };
    }
    if (fechaDesde > hoy) {
      throw { status: 400, message: 'La fecha de inicio no puede ser una fecha futura.' };
    }
  }

  if (hasta) {
    const fechaHasta = new Date(hasta);
    if (fechaHasta < hace31Dias) {
      throw { status: 400, message: 'La fecha de fin no puede ser anterior a los últimos 31 días.' };
    }
    if (fechaHasta > hoy) {
      throw { status: 400, message: 'La fecha de fin no puede ser una fecha futura.' };
    }
  }

  if (desde && hasta) {
    const fechaDesde = new Date(desde);
    const fechaHasta = new Date(hasta);
    if (fechaDesde > fechaHasta) {
      throw { status: 400, message: "La fecha 'Desde' no puede ser mayor que la fecha 'Hasta'." };
    }
  }

  // Construcción de filtros
  const where = {
    usuario_id,
    estado: 'cerrada',
  };

  if (estado === 'abierta' || estado === 'cerrada') {
    where.estado = estado;
  }

  if (desde && hasta) {
    where.closed_at = {
      [Op.between]: [new Date(desde), new Date(hasta)],
    };
  } else if (desde) {
    where.closed_at = {
      [Op.gte]: new Date(desde),
    };
  } else if (hasta) {
    where.closed_at = {
      [Op.lte]: new Date(hasta),
    };
  } else {
    where.closed_at = {
      [Op.gte]: hace31Dias,
    };
  }

  const { count, rows: cajas } = await Caja.findAndCountAll({
    where,
    order: [['closed_at', 'DESC']],
    attributes: ['id', 'monto_inicial', 'monto_final', 'closed_at', 'hora_apertura', 'observacion', 'estado'],
    include: [
      {
        model: Usuario,
        attributes: ['id', 'nombre'],
      },
      {
        model: Venta,
        where: { estado: 'completada' },
        required: false,
        attributes: ['id', 'total', 'estado'],
      },
      {
        model: Egreso,
        where: { estado: 'activo' },
        required: false,
        attributes: ['id', 'monto', 'estado'],
      },
    ],
    limit: parseInt(limite),
    offset: parseInt(offset),
  });

  const formatearHora = (hora) => {
    return new Date(`1970-01-01T${hora}Z`).toLocaleTimeString('es-NI', {
      timeZone: 'America/Managua',
      hour12: true,
    });
  };

  const historial = cajas.map(caja => {
    const totalVentas = caja.Venta?.reduce((acc, v) => acc + parseFloat(v.total), 0) || 0;
    const totalEgresos = caja.Egresos?.reduce((acc, e) => acc + parseFloat(e.monto), 0) || 0;
    const dineroEsperado = parseFloat(caja.monto_inicial) + totalVentas - totalEgresos;

    return {
      id: caja.id,
      monto_inicial: caja.monto_inicial,
      monto_final: caja.monto_final,
      hora_apertura: formatearHora(caja.hora_apertura),
      closed_at: caja.closed_at,
      estado: caja.estado,
      hora_cierre: caja.closed_at,
      observacion: caja.observacion,
      total_ventas: totalVentas,
      total_egresos: totalEgresos,
      dinero_esperado: dineroEsperado,
      usuario: caja.Usuario,
    };
  });

  return {
    success: true,
    historial,
    total: count,
    pagina: parseInt(pagina),
    paginas: Math.ceil(count / limite),
    message: historial.length === 0 ? 'No hay cierres registrados en los últimos 31 días' : undefined,
  };
}



export async function verCajaAbiertaService(usuario_id) {
  const caja = await Caja.findOne({
    where: { usuario_id, estado: 'abierta' },
    include: [
      {
        model: Venta,
        where: { estado: 'completada' },
        required: false,
        attributes: ['id', 'total', 'estado']
      },
      {
        model: Egreso,
        where: { estado: 'activo' },
        required: false,
        attributes: ['id', 'monto', 'estado']
      }
      
    ]
    
  });
 
  if (!caja) throw { status: 404, message: 'No hay caja abierta para este usuario.' };

  // Aquí usamos la propiedad que te devuelve Sequelize, que es singular
  const totalVentas = caja.Venta?.reduce((acc, v) => acc + parseFloat(v.total), 0) || 0;
  const totalEgresos = caja.Egresos?.reduce((acc, e) => acc + parseFloat(e.monto), 0) || 0;
  const dineroEsperado = parseFloat(caja.monto_inicial) + totalVentas - totalEgresos;

  return {
    success: true,
    caja: {
      id: caja.id,
      monto_inicial: caja.monto_inicial,
      total_ventas: totalVentas,
      total_egresos: totalEgresos,
      dinero_esperado: dineroEsperado,
      hora_apertura: caja.created_at
    }
  };
}

 

export async function cajaActualService(usuario_id) {
  const caja = await Caja.findOne({
    where: { usuario_id, estado: 'abierta' },
    include: [
      {
        model: Venta,
        where: { estado: 'completada' },
        required: false,
        attributes: ['id', 'total', 'estado']
      },
      {
        model: Egreso,
        where: { estado: 'activo' },
        required: false,
        attributes: ['id', 'monto', 'estado']
      }
      
    ]
    
  });
 
  if (!caja) throw { status: 404, message: 'No hay caja abierta para este usuario.' };

  // Aquí usamos la propiedad que te devuelve Sequelize, que es singular
  const totalVentas = caja.Venta?.reduce((acc, v) => acc + parseFloat(v.total), 0) || 0;
  const totalEgresos = caja.Egresos?.reduce((acc, e) => acc + parseFloat(e.monto), 0) || 0;
  const dineroEsperado = parseFloat(caja.monto_inicial) + totalVentas - totalEgresos;

  return {
    success: true,
    caja: {
      id: caja.id,
      monto_inicial: caja.monto_inicial,
      total_ventas: totalVentas,
      total_egresos: totalEgresos,
      dinero_esperado: dineroEsperado,
      hora_apertura: caja.created_at
    }
  };
}

export const listarCajasParaSelectorService = async () => {
  const hoyInicio = new Date();
  hoyInicio.setHours(0, 0, 0, 0);

  const hoyFin = new Date();
  hoyFin.setHours(23, 59, 59, 999);

  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - 31);

  // Caja abierta hoy (si existe)
  const cajaAbiertaHoy = await Caja.findOne({
    where: {
      estado: 'abierta',
      created_at: { [Op.between]: [hoyInicio, hoyFin] }
    },
    include: [
      {
        model: Usuario,
        attributes: ['id', 'nombre']
      }
    ],
    attributes: ['id', 'created_at'],
    order: [['created_at', 'DESC']]
  });

  // Cajas cerradas en los últimos 31 días
  const cajasCerradas = await Caja.findAll({
    where: {
      estado: 'cerrada',
      created_at: { [Op.gte]: fechaLimite }
    },
    include: [
      {
        model: Usuario,
        attributes: ['id', 'nombre']
      }
    ],
    attributes: ['id', 'created_at', 'closed_at'],
    order: [['created_at', 'DESC']]
  });

  // Mapear y simplificar las respuestas
  const cajaAbierta = cajaAbiertaHoy
    ? {
        id: cajaAbiertaHoy.id,
        fecha_apertura: cajaAbiertaHoy.created_at,
        cajero: cajaAbiertaHoy.Usuario?.nombre || 'Desconocido'
      }
    : null;

  const cajas = cajasCerradas.map(caja => ({
    id: caja.id,
    fecha_apertura: caja.created_at,
    fecha_cierre: caja.closed_at,
    cajero: caja.Usuario?.nombre || 'Desconocido'
  }));

  return {
    cajaAbiertaHoy: cajaAbierta,
    cajasCerradas: cajas
  };
};


