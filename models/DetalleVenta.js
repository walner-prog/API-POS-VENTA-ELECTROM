import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const DetalleVenta = sequelize.define('DetalleVenta', {
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },
  total_linea: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },
}, {
  tableName: 'detalle_ventas',
  timestamps: false
})

export default DetalleVenta
