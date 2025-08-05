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
  const { page = 1, limit = 10, tipo = '' } = query;
  const where = { caja_id };
  if (tipo) where.tipo = tipo;

  const { count, rows } = await Ingreso.findAndCountAll({
    where,
    include: [Caja, Usuario],
    order: [['created_at', 'DESC']],
    offset: (page - 1) * limit,
    limit: parseInt(limit)
  });

  return { total: count, ingresos: rows };
}

export async function anularIngresoService(id, anulado_por) {
  const ingreso = await Ingreso.findByPk(id);
  if (!ingreso) throw new Error('Ingreso no encontrado');
  if (ingreso.estado === 'anulado') throw new Error('Ya está anulado');

  ingreso.estado = 'anulado';
  ingreso.anulado_por = anulado_por;
  ingreso.anulado_en = new Date();
  await ingreso.save();

  return ingreso;
}
