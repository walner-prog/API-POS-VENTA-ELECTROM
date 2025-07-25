import Joi from 'joi'

export const abrirCajaSchema = Joi.object({
  monto_inicial: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'El monto inicial debe ser un número.',
      //'number.positive': 'El monto inicial debe ser un número positivo mayor que cero.',
      'any.required': 'El monto inicial es obligatorio.'
    }),
  observacion: Joi.string()
    .allow('', null)
    .messages({
      'string.base': 'La observación debe ser texto.'
    }),
  nombre: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.base': 'El nombre debe ser texto.',
      'string.min': 'El nombre debe tener al menos {#limit} caracteres.',
      'string.max': 'El nombre no puede exceder {#limit} caracteres.',
      //'any.required': 'El nombre es obligatorio.'
    })
})


