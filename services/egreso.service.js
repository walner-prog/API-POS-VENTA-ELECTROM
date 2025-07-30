import { Egreso, Caja,Venta } from '../models/index.js'
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


export const listarCajasParaSelectorService = async (usuario_id, esAdmin) => {
  const hoyInicio = new Date();
  hoyInicio.setHours(0, 0, 0, 0);
  const hoyFin = new Date();
  hoyFin.setHours(23, 59, 59, 999);

  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - 31);

  // Filtro base según si es admin o no
  const filtroUsuario = esAdmin ? {} : { usuario_id };

  // Cajas abiertas del día
  const cajasAbiertasHoy = await Caja.findAll({
    where: {
      estado: 'abierta',
      created_at: { [Op.between]: [hoyInicio, hoyFin] },
      ...filtroUsuario
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
      created_at: { [Op.gte]: fechaLimite },
      ...filtroUsuario
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

  // Mapeo de cajas abiertas
  const cajasAbiertasMapeadas = cajasAbiertasHoy.map(caja => ({
    id: caja.id,
    fecha_apertura: caja.created_at,
    cajero: caja.Usuario?.nombre || 'Desconocido'
  }));

  // Mapeo de cajas cerradas
  const cajasCerradasMapeadas = cajasCerradas.map(caja => ({
    id: caja.id,
    fecha_apertura: caja.created_at,
    fecha_cierre: caja.closed_at,
    cajero: caja.Usuario?.nombre || 'Desconocido'
  }));

  return {
    cajasAbiertas: cajasAbiertasMapeadas,
    cajasCerradas: cajasCerradasMapeadas
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
