import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Egreso = sequelize.define('Egreso', {
  tipo: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  referencia: {
    type: DataTypes.STRING(100)
    
  },
  monto: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING(255)
  },
  metodo_pago: {
    type: DataTypes.ENUM('efectivo'),
    defaultValue: 'efectivo'
  },
  anulado_por: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  estado: {
  type: DataTypes.ENUM('activo', 'anulado'),
  defaultValue: 'activo'
},
anulado_en: {
  type: DataTypes.DATE,
  allowNull: true
},
}, {
  tableName: 'egresos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
})

export default Egreso
