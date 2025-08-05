import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Ingreso = sequelize.define('Ingreso', {
  tipo: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  referencia: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  metodo_pago: {
    type: DataTypes.ENUM('efectivo'),
    defaultValue: 'efectivo'
  },
  estado: {
    type: DataTypes.ENUM('activo', 'anulado'),
    defaultValue: 'activo'
  },
  anulado_por: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  anulado_en: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'ingresos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
})

export default Ingreso
