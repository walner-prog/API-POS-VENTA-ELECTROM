// validaciones/venta.validacion.js
import Joi from 'joi';

export const validarVenta = async (data) => {
  const schema = Joi.object({
    cliente_id: Joi.number().integer().optional(),
    carrito: Joi.array().items(
      Joi.object({
        producto_id: Joi.number().integer().required(),
        cantidad: Joi.number().positive().required(),
        precio_unitario: Joi.number().positive().required(),
        total_linea: Joi.number().positive().optional()
      })
    ).min(1).required(),
 
    total: Joi.number().positive().required(),
    subtotal: Joi.number().positive().optional(),
    descuento: Joi.number().min(0).optional(),
    iva: Joi.number().min(0).optional(),
    cliente_nombre: Joi.string().optional(),
    observacion: Joi.string().optional()
  });

  try {
    await schema.validateAsync(data);
  } catch (err) {
    throw { status: 400, message: `Datos inválidos: ${err.message}` };
  }
};


export const validarCancelacion = async (data) => {
  const schema = Joi.object({
    motivo: Joi.string().min(3).required()
  });

  try {
    await schema.validateAsync(data);
  } catch (err) {
    throw { status: 400, message: `Motivo inválido: ${err.message}` };
  }
};
