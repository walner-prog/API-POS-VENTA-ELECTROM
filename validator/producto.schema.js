import Joi from "joi";

export const crearProductoSchema = Joi.object({
  nombre: Joi.string().max(150).required(),
  codigo_barra: Joi.string().max(50).optional().allow(null, ""),
  categoria_id: Joi.number().integer().required(),
  
  precio_compra: Joi.number().precision(2).positive().required(),
  precio_venta: Joi.number().precision(2).positive().required(),

  // ✅ stock puede ser decimal
  stock: Joi.number().precision(3).min(0).required(),

  unidad_medida: Joi.string().max(20).optional().allow(null, ""),
  presentacion: Joi.string().max(50).optional().allow(null, ""),

  // ✅ nuevos campos de unidad y tipo decimal
  unidad_base: Joi.string()
    .max(20)
    .valid(
      "unidad",
      "libra",
      "kilo",
      "quintal",
      "litro",
      "galon",
      "metro",
      "yarda"
    )
    .optional()
    .default("unidad"),

  es_decimal: Joi.boolean().optional().default(false),
  descuento: Joi.number().min(0).max(100).optional().default(0),
  // ✅ campos de mayoreo y descuento
  venta_mayoreo: Joi.boolean().optional(),
  precio_mayoreo: Joi.number().precision(2).optional().allow(null),
  minimo_mayoreo: Joi.number().integer().optional().allow(null),
  maximo_mayoreo: Joi.number().integer().optional().allow(null),



  // ✅ campos de promoción
  promocion: Joi.boolean().optional().default(false),
  fecha_promocion: Joi.date().optional().allow(null),
  fecha_final_promocion: Joi.date().optional().allow(null),
  descuento_promocion: Joi.number().min(0).max(100).optional().default(0),
});

export const editarProductoSchema = crearProductoSchema.keys({
  // Opcional, en edición no exigimos algunos campos
  nombre: Joi.string().max(150).optional(),
  categoria_id: Joi.number().integer().optional(),
});
