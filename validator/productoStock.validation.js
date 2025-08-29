import Joi from 'joi'

export const validarAgregarStock = (req, res, next) => {
  const schema = Joi.object({
    producto_id: Joi.number().integer().required().messages({
      'any.required': 'El producto_id es requerido',
      'number.base': 'El producto_id debe ser un número',
      'number.integer': 'El producto_id debe ser un número entero'
    }),
    cantidad: Joi.number().integer().positive().required().messages({
      'any.required': 'La cantidad es requerida',
      'number.base': 'La cantidad debe ser un número',
      'number.integer': 'La cantidad debe ser un número entero',
      'number.positive': 'La cantidad debe ser mayor a cero'
    }),
    tipo_movimiento: Joi.string().valid('compra','venta','ajuste','devolucion','otro','Dañado','Perdido').required().messages({
      'any.required': 'El tipo_movimiento es requerido',
      'any.only': 'El tipo_movimiento no es válido'
    }),
    observaciones: Joi.string().allow('').max(255).messages({
      'string.base': 'Las observaciones deben ser un texto',
      'string.max': 'Las observaciones no pueden exceder 255 caracteres'
    })
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: 'Datos inválidos',
      details: error.details.map(d => d.message)
    });
  }

  next();
}

// Validación para restar stock
export const validarRestarStock = (req, res, next) => {
  const schema = Joi.object({
    producto_id: Joi.number().integer().required().messages({
      'any.required': 'El producto_id es requerido',
      'number.base': 'El producto_id debe ser un número',
      'number.integer': 'El producto_id debe ser un número entero'
    }),
    cantidad: Joi.number().integer().positive().required().messages({
      'any.required': 'La cantidad es requerida',
      'number.base': 'La cantidad debe ser un número',
      'number.integer': 'La cantidad debe ser un número entero',
      'number.positive': 'La cantidad debe ser mayor a cero'
    }),
    tipo_movimiento: Joi.string().valid('compra','venta','ajuste','devolucion','otro','dañado','perdido','anulacion_compra').required().messages({
      'any.required': 'El tipo_movimiento es requerido',
      'any.only': 'El tipo_movimiento no es válido'
    }),
    observaciones: Joi.string().allow('').max(255).messages({
      'string.base': 'Las observaciones deben ser un texto',
      'string.max': 'Las observaciones no pueden exceder 255 caracteres'
    })
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: 'Datos inválidos',
      details: error.details.map(d => d.message)
    });
  }

  next();
}

