import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Caja = sequelize.define('Caja', {
  monto_inicial: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },
  nombre: {
  type: DataTypes.STRING(100),
  allowNull: true
},

  monto_final: {
    type: DataTypes.DECIMAL(10,2)
  },
  estado: {
    type: DataTypes.ENUM('abierta','cerrada'),
    defaultValue: 'abierta'
  },
  observacion: {
    type: DataTypes.STRING(255)
  },
  hora_apertura: {
    type: DataTypes.TIME
  },
  closed_at: {
    type: DataTypes.DATE
  },
   abierto_por: {
    type: DataTypes.INTEGER, // id del admin que abrió
    allowNull: true
  }
}, {
  tableName: 'cajas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
})

export default Caja
