import {
  DataTypes
} from 'sequelize'
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
    type: DataTypes.DECIMAL(10, 2), // ✅ hasta 99,999,999.99
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
    defaultValue: 0.00, // valor en porcentaje
    allowNull: false
  },


}, {
  tableName: 'productos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [{
      fields: ['codigo_barra']
    },
    {
      fields: ['categoria_id']
    }
  ]
})

export default Producto