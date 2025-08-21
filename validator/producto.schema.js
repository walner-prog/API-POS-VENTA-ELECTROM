// src/validators/producto.schema.js
import Joi from 'joi'

export const crearProductoSchema = Joi.object({
  nombre: Joi.string().max(150).required(),
  codigo_barra: Joi.string().max(50).optional().allow(null, ''),
  categoria_id: Joi.number().integer().required(),
  precio_compra: Joi.number().precision(2).required(),
  precio_venta: Joi.number().precision(2).required(),
  stock: Joi.number().integer().min(0).required(),
  unidad_medida: Joi.string().max(20).optional().allow(null, ''),
  presentacion: Joi.string().max(50).optional().allow(null, ''),
  
  venta_mayoreo: Joi.boolean().optional(),
  precio_mayoreo: Joi.number().precision(2).optional().allow(null),
  minimo_mayoreo: Joi.number().integer().optional().allow(null),
   descuento: Joi.number().min(0).max(100).optional()  // ← agrega esto
})

export const editarProductoSchema = crearProductoSchema
