import { Caja, Usuario,Ingreso } from '../models/index.js'
 
async function validarCajaAbierta(usuario_id) {
  const caja = await Caja.findOne({ where: { usuario_id, estado: 'abierta' } });
  if (!caja) throw new Error('No hay una caja abierta');
  return caja;
}

export async function crearIngresoService(data, usuario) {
  const caja = await validarCajaAbierta(usuario.id);
  const ingreso = await Ingreso.create({ ...data, usuario_id: usuario.id, caja_id: caja.id });
  return ingreso;
}

export async function actualizarIngresoService(id, data) {
  const ingreso = await Ingreso.findByPk(id);
  if (!ingreso) throw new Error('Ingreso no encontrado');
  await ingreso.update(data);
  return ingreso;
}

 
export async function listarIngresosPorCajaService(caja_id, query) {
  const { page = 1, limit = 5, tipo = '' } = query;
  const where = { caja_id };
  if (tipo) where.tipo = tipo;

  const { count, rows } = await Ingreso.findAndCountAll({
    where,
    include: [
      {
        model: Caja,
        attributes: ['id', 'nombre', 'monto_inicial', 'estado', 'hora_apertura', 'closed_at']
      },
      {
        model: Usuario,
        attributes: ['id', 'nombre', 'role_id']
      }
    ],
    order: [['created_at', 'DESC']],
    offset: (page - 1) * limit,
    limit: parseInt(limit)
  });

  return { total: count, ingresos: rows };
}


export async function anularIngresoService(id, anulado_por) {
    // Start a transaction to ensure atomicity (all or nothing)
    const t = await sequelize.transaction();

    try {
        const ingreso = await Ingreso.findOne({
            where: { id: id },
            include: [{ model: Caja, attributes: ['estado'] }], // Fetch the related Caja's status
            transaction: t
        });

        if (!ingreso) {
            throw { status: 404, message: 'Ingreso no encontrado.' };
        }
        if (ingreso.estado === 'anulado') {
            throw { status: 400, message: 'El ingreso ya ha sido anulado.' };
        }

        // ✅ KEY ADDITION: Check if the associated cash register is open.
        const caja = ingreso.Caja;
        if (!caja) {
            throw { status: 404, message: 'Caja asociada no encontrada.' };
        }
        if (caja.estado !== 'abierta') {
            throw { status: 400, message: 'No se puede anular un ingreso de la caja # ' + caja.id + ' que ya está cerrada.' };
        }

        // Update the ingreso record
        ingreso.estado = 'anulado';
        ingreso.anulado_por = anulado_por;
        ingreso.anulado_en = new Date();
        await ingreso.save({ transaction: t });

        // Commit the transaction
        await t.commit();

        return { success: true, message: 'Ingreso anulado correctamente.' };

    } catch (error) {
        // If an error occurs, roll back the transaction
        await t.rollback();
        // Re-throw the error so it can be handled by the caller
        throw error;
    }
}