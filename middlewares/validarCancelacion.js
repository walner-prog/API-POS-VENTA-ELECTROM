import bcrypt from 'bcryptjs';
import ClaveCancelacion from '../models/ClaveCancelacion.js';

export async function validarCancelacion(body) {
  const { clave } = body;

  if (!clave) {
    throw { status: 400, message: "Debe ingresar una clave para cancelar la venta." };
  }

  const claveActiva = await ClaveCancelacion.findOne({ where: { activa: true } });

  if (!claveActiva) {
    throw { status: 403, message: "No hay clave activa para cancelación." };
  }

  const esValida = await bcrypt.compare(clave, claveActiva.clave_hash);

  if (!esValida) {
    throw { status: 401, message: "Clave inválida o no activa." };
  }

  // (Opcional) Validar si ya expiró
  if (claveActiva.expira_en && new Date() > new Date(claveActiva.expira_en)) {
    throw { status: 403, message: "La clave ha expirado." };
  }

  return true;
}
