import Servicio from '../models/Servicio.js';
import TipoServicio from '../models/TipoServicio.js';
import { Caja, Usuario } from '../models/index.js';
import sequelize from '../config/database.js';

async function validarCajaAbierta(usuario_id) {
  const caja = await Caja.findOne({ where: { usuario_id, estado: 'abierta' } });
  if (!caja) throw { status: 400, message: 'No hay una caja abierta' };
  return caja;
}

export async function crearServicioService(data, usuario) {
  const t = await sequelize.transaction();
  try {
    const caja = await validarCajaAbierta(usuario.id);

    if (caja.usuario_id !== usuario.id) {
      throw { status: 403, message: 'No tienes permiso para operar en esta caja' };
    }

    const tipo = await TipoServicio.findByPk(data.tipo_servicio_id);
    if (!tipo) throw { status: 404, message: 'Tipo de servicio no encontrado' };

    const servicio = await Servicio.create({
      tipo_servicio_id: data.tipo_servicio_id,
      monto: data.monto,
      usuario_id: usuario.id,
      caja_id: caja.id,
      fecha: data.fecha || new Date()
    }, { transaction: t });

    // ✔ SUMAR DINERO A LA CAJA
    caja.monto_final = parseFloat(caja.monto_final) + parseFloat(data.monto);
    await caja.save({ transaction: t });

    await t.commit();
    return servicio;

  } catch (error) {
    await t.rollback();
    throw error;
  }
}

export async function listarServiciosService(query = {}) {
  const { page = 1, limit = 300, tipo = '' } = query;

  const where = {};
  if (tipo) where.tipo_servicio_id = tipo;

  const { count, rows } = await Servicio.findAndCountAll({
    where,
    include: [
      { model: TipoServicio, attributes: ['id', 'nombre'] },
      { model: Caja, attributes: ['id', 'nombre'] },
      { model: Usuario, attributes: ['id', 'nombre'] }
    ],
    order: [['created_at', 'DESC']],
    offset: (page - 1) * limit,
    limit: parseInt(limit)
  });

  return { total: count, servicios: rows };
}

export async function eliminarServicioService(id, anulado_por) {
  const t = await sequelize.transaction();
  try {
    const servicio = await Servicio.findOne({
      where: { id },
      include: [{ model: Caja }],
      transaction: t
    });

    if (!servicio) throw { status: 404, message: "Servicio no encontrado" };
    if (servicio.estado === "anulado")
      throw { status: 400, message: "El servicio ya está anulado" };

    const caja = servicio.Caja;
    if (caja.estado !== "abierta")
      throw { status: 400, message: "No se puede anular porque la caja está cerrada" };

    // ✔ RESTAR DINERO A LA CAJA
   // caja.monto_final = parseFloat(caja.monto_final) - parseFloat(servicio.monto);
    //if (caja.monto_final < 0) caja.monto_final = 0;
   // await caja.save({ transaction: t });

    servicio.estado = 'anulado';
    await servicio.save({ transaction: t });

    await servicio.destroy({ transaction: t }); // soft delete

    await t.commit();
    return { success: true };

  } catch (error) {
    await t.rollback();
    throw error;
  }
}
