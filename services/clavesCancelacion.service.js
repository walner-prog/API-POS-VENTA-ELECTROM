import ClaveCancelacion from '../models/ClaveCancelacion.js';
import bcrypt from 'bcryptjs';

/**
 * Listar todas las claves (solo para admin).
 */
export async function listarClavesCancelacionService() {
  return await ClaveCancelacion.findAll({
    order: [['created_at', 'DESC']]
  });
}

/**
 * Crear una nueva clave (hasheada) con validación.
 */
export async function crearClaveCancelacionService(clave, expira_en = null) {
  if (!clave) {
    throw { status: 400, message: 'La clave es obligatoria.' };
  }

  const hash = await bcrypt.hash(clave, 10);
  return await ClaveCancelacion.create({ clave_hash: hash, expira_en });
}

/**
 * Activar una clave específica y desactivar las demás.
 */
export async function activarClaveCancelacionService(id) {
  const clave = await ClaveCancelacion.findByPk(id);
  if (!clave) throw { status: 404, message: 'Clave no encontrada.' };

  // Desactivar todas
  await ClaveCancelacion.update({ activa: false }, { where: {} });

  // Activar la clave indicada
  clave.activa = true;
  await clave.save();

  return clave;
}

/**
 * Eliminar una clave solo si NO está activa.
 */
export async function eliminarClaveCancelacionService(id) {
  const clave = await ClaveCancelacion.findByPk(id);
  if (!clave) throw { status: 404, message: 'Clave no encontrada.' };

  if (clave.activa) {
    throw { status: 400, message: 'No se puede eliminar una clave activa.' };
  }

  await clave.destroy();
  return true;
}

/**
 * Validar una clave ingresada contra la activa.
 */
export async function validarClaveCancelacionService(claveIngresada) {
  if (!claveIngresada) {
    throw { status: 400, message: 'Debe ingresar una clave.' };
  }

  const activa = await ClaveCancelacion.findOne({ where: { activa: true } });
  if (!activa) throw { status: 403, message: 'No hay clave activa para cancelación.' };

  const esValida = await bcrypt.compare(claveIngresada, activa.clave_hash);
  if (!esValida) throw { status: 401, message: 'Clave inválida o incorrecta.' };

  if (activa.expira_en && new Date() > new Date(activa.expira_en)) {
    throw { status: 403, message: 'La clave ha expirado.' };
  }

  return {
    ok: true,
    mensaje: 'Clave válida, cancelación permitida.'
  };
}
