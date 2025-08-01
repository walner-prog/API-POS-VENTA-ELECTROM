import { Egreso, Caja,Venta,Usuario } from '../models/index.js'
import { Op } from 'sequelize'
 

export const crearEgresoService = async (datos, usuario_id) => {
  const caja = await Caja.findOne({
    where: {
      id: datos.caja_id,
      estado: 'abierta',
      abierto_por: usuario_id
    }
  })

  if (!caja) {
    throw { status: 400, message: 'Caja no encontrada o cerrada' }
  }

  const totalVentas = await Venta.sum('total', {
    where: { caja_id: caja.id, estado: 'completada' }
  }) || 0

  const totalEgresos = await Egreso.sum('monto', {
    where: { caja_id: caja.id, estado: 'activo' }
  }) || 0

  const montoDisponible = parseFloat(caja.monto_inicial) + totalVentas - totalEgresos
  const montoEgreso = parseFloat(datos.monto)

  if (montoEgreso > montoDisponible) {
    const faltante = (montoEgreso - montoDisponible).toFixed(2)
    throw {
      status: 400,
      message: `Fondos insuficientes en caja. Disponible: $${montoDisponible.toFixed(2)}, faltan $${faltante} para cubrir este egreso.`
    }
  }

  const nuevo = await Egreso.create({
    ...datos,
    usuario_id,
    caja_id: caja.id
  })

  return nuevo
}

export const editarEgresoService = async (egreso_id, datos, usuario_id) => {
  // 1. Buscar el egreso activo que se quiere editar
  const egreso = await Egreso.findOne({
    where: { id: egreso_id, estado: 'activo' }
  });

  if (!egreso) {
    throw { status: 404, message: 'Egreso no encontrado o anulado' };
  }

  // 2. Verificar que la caja esté abierta y fue abierta por el mismo usuario
  const caja = await Caja.findOne({
    where: {
      id: egreso.caja_id,
      estado: 'abierta',
      abierto_por: usuario_id
    }
  });

  if (!caja) {
    throw { status: 400, message: 'Caja no encontrada o cerrada por otro usuario' };
  }

  // 3. Calcular monto disponible (excluyendo el egreso actual)
  const totalVentas = await Venta.sum('total', {
    where: { caja_id: caja.id, estado: 'completada' }
  }) || 0;

  const totalEgresos = await Egreso.sum('monto', {
    where: {
      caja_id: caja.id,
      estado: 'activo',
      id: { [Op.ne]: egreso.id } // excluye el egreso actual
    }
  }) || 0;

  const montoDisponible = parseFloat(caja.monto_inicial) + totalVentas - totalEgresos;
  const nuevoMonto = parseFloat(datos.monto);

  if (nuevoMonto > montoDisponible) {
    const faltante = (nuevoMonto - montoDisponible).toFixed(2);
    throw {
      status: 400,
      message: `Fondos insuficientes en caja. Disponible: $${montoDisponible.toFixed(2)}, faltan $${faltante} para cubrir este egreso.`
    };
  }

  // 4. Actualizar egreso
  egreso.tipo = datos.tipo;
  egreso.referencia = datos.referencia || null;
  egreso.monto = nuevoMonto;
  egreso.descripcion = datos.descripcion || null;
 
  await egreso.save();

  return {
    success: true,
    message: 'Egreso actualizado correctamente',
    egreso
  };
};



export const listarEgresosPorCajaService = async ({ caja_id, tipo, page = 1, limit = 5 }) => {
  const offset = (page - 1) * limit;

  // Limita la búsqueda a egresos de los últimos 31 días
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - 31);

  let cajaIdFinal = caja_id;

  if (!caja_id) {
    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);
    const hoyFin = new Date();
    hoyFin.setHours(23, 59, 59, 999);

    const cajaHoy = await Caja.findOne({
      where: {
        estado: 'abierta',
        fecha_apertura: { [Op.between]: [hoyInicio, hoyFin] }
      },
      order: [['fecha_apertura', 'DESC']]
    });

    if (!cajaHoy) {
      throw new Error('No hay caja abierta hoy y no se especificó una caja.');
    }

    cajaIdFinal = cajaHoy.id;
  }

  const where = {
    caja_id: cajaIdFinal,
    estado: { [Op.or]: ['activo', 'anulado'] },
    created_at: { [Op.gte]: fechaLimite }
  };

  if (tipo) {
    where.tipo = { [Op.like]: `%${tipo}%` };
  }

  const { count, rows } = await Egreso.findAndCountAll({
    where,
    include: [
      {
        model: Usuario,
        attributes: ['id', 'nombre']
      }
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset
  });

  return {
    total: count,
    pagina_actual: page,
    total_paginas: Math.ceil(count / limit),
    egresos: rows,
    caja_id: cajaIdFinal
  };
};
 


export const anularEgresoService = async (egreso_id, usuario_id) => {
  const egreso = await Egreso.findOne({
    where: { id: egreso_id, estado: 'activo' },
    include: [Caja]
  });

  if (!egreso) {
    throw { status: 404, message: 'Egreso no encontrado o ya anulado' };
  }

  const caja = egreso.Caja;
  if (!caja) throw { status: 404, message: 'Caja asociada no encontrada' };

  // Ya no devolvemos dinero a la caja, solo marcamos como anulado
  egreso.estado = 'anulado';
  egreso.anulado_por = usuario_id;
  egreso.anulado_en = new Date();
  await egreso.save();

  return { success: true, message: 'Egreso anulado correctamente' };
};
