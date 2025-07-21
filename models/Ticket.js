import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Ticket = sequelize.define('Ticket', {
  numero_ticket: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('vendido','anulado'),
    defaultValue: 'vendido'
  },
  observacion: {
    type: DataTypes.STRING(255)
  },
  venta_id: {
  type: DataTypes.INTEGER,
  allowNull: false
}

}, {
  tableName: 'tickets',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
})

export default Ticket
