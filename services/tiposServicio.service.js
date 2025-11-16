// services/tiposServicio.service.js
import TipoServicio from '../models/TipoServicio.js';
import sequelize from '../config/database.js';

export async function crearTipoServicioService(data) {
  const tipo = await TipoServicio.create({ nombre: data.nombre });
  return tipo;
}

export async function listarTiposServicioService(query = {}) {
  const { page = 1, limit = 100 } = query;
  const { count, rows } = await TipoServicio.findAndCountAll({
    order: [['created_at', 'DESC']],
    offset: (page - 1) * limit,
    limit: parseInt(limit)
  });
  return { total: count, tipos: rows };
}

export async function eliminarTipoServicioService(id) {
  const t = await sequelize.transaction();
  try {
    const tipo = await TipoServicio.findByPk(id, { transaction: t });
    if (!tipo) throw { status: 404, message: 'Tipo de servicio no encontrado' };
    await tipo.destroy({ transaction: t }); // soft delete (paranoid)
    await t.commit();
    return { success: true };
  } catch (err) {
    await t.rollback();
    throw err;
  }
}
