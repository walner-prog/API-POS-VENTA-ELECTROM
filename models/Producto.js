import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Producto = sequelize.define('Producto', {
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  codigo_barra: {
    type: DataTypes.STRING(50),
    unique: true
  },
  categoria_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  precio_compra: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  precio_venta: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  utilidad: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  stock: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  unidad_medida: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  presentacion: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  unidad_base: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: "unidad",
    comment: "Unidad base de control (libra, litro, metro, unidad, etc.)"
  },
  es_decimal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Define si permite fracciones (ej. 2.5 libras)"
  },
  descuento: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    allowNull: false
  },

  // ===============================
  // Campos para venta por mayoreo
  // ===============================
  venta_mayoreo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Indica si este producto se puede vender al por mayor"
  },
  precio_mayoreo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: "Precio por mayoreo"
  },
  minimo_mayoreo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Cantidad mínima para venta por mayoreo"
  },

  maximo_mayoreo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Cantidad máxima para venta por mayoreo"
  },

  promocion: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Indica si el producto está en promoción"
  },
  fecha_promocion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Fecha de inicio de la promoción"
  },

  fecha_final_promocion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Fecha de finalización de la promoción"
  },

  descuento_promocion: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    allowNull: true,
    comment: "Descuento aplicado durante la promoción"
  },

}, {
  tableName: 'productos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['codigo_barra'] },
    { fields: ['categoria_id'] }
  ]
})

export default Producto
