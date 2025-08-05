// middlewares/validarCancelacion.js
import bcrypt from 'bcryptjs';
import ClaveCancelacion from '../models/ClaveCancelacion.js';
import Joi from 'joi';

export async function validarCancelacion(req, res, next) {
  const { clave, motivo } = req.body;

  // Validar motivo con Joi
  const schema = Joi.object({
    motivo: Joi.string().min(3).required(),
    clave: Joi.string().required(),
  });

  try {
    await schema.validateAsync({ clave, motivo });
  } catch (err) {
    return res.status(400).json({ message: `Motivo o clave inválido: ${err.message}` });
  }

  // Validar clave activa
  const claveActiva = await ClaveCancelacion.findOne({ where: { activa: true } });

  if (!claveActiva) {
    return res.status(403).json({ message: "No hay clave activa para cancelación." });
  }

  const esValida = await bcrypt.compare(clave, claveActiva.clave_hash);

  if (!esValida) {
    return res.status(401).json({ message: "Clave inválida o no activa." });
  }

  // Validar expiración
  if (claveActiva.expira_en && new Date() > new Date(claveActiva.expira_en)) {
    return res.status(403).json({ message: "La clave ha expirado." });
  }

  // Si todo está bien, seguir
  next();
}
