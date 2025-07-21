import Joi from 'joi'

// Validación para agregar stock
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
    })
  })

  const { error } = schema.validate(req.body)

  if (error) {
    return res.status(400).json({
      message: 'Datos inválidos',
      details: error.details.map(d => d.message)
    })
  }

  next()
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
    })
  })

  const { error } = schema.validate(req.body)

  if (error) {
    return res.status(400).json({
      message: 'Datos inválidos',
      details: error.details.map(d => d.message)
    })
  }

  next()
}
