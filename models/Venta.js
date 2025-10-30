import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Venta = sequelize.define('Venta', {
  cliente_nombre: {
    type: DataTypes.STRING(100)
  },
  subtotal:{
    type: DataTypes.DECIMAL(10,2),
    allowNull: false

  },
 
  descuento: {
    type: DataTypes.DECIMAL(5,2),
    defaultValue: 0.00
  },
  iva: {
    type: DataTypes.DECIMAL(5,2),
    defaultValue: 0.00
  },
   total: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },
  observacion: {
    type: DataTypes.STRING(255)
  },
  estado: {
    type: DataTypes.ENUM('completada', 'cancelada'),
    allowNull: false,
    defaultValue: 'completada'
  },
  motivo_cancelacion: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  cancelada_por: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  cancelada_en: {
    type: DataTypes.DATE,
    allowNull: true
  },
  paga_con: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
    defaultValue: 0.00
  },
  cambio: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
    defaultValue: 0.00
  }
}, {
  tableName: 'ventas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
})

export default Venta
