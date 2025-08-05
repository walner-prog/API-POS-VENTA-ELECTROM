import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const InventarioLote = sequelize.define('InventarioLote', {
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  fecha_caducidad: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fecha_ingreso: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  precio_compra: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  proveedor: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  egreso_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'inventario_lotes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['producto_id'] },
    { fields: ['fecha_caducidad'] },
    { fields: ['egreso_id'] }
  ]
})

export default InventarioLote
