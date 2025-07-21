import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const MovimientoCaja = sequelize.define('MovimientoCaja', {
  tipo: {
    type: DataTypes.ENUM('ingreso', 'egreso'),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  caja_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  referencia_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  referencia_tipo: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  motivo_cancelacion: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  eliminado_por: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  eliminado_en: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'movimientos_caja',
  timestamps: false,
  indexes: [
    { fields: ['caja_id'] },
    { fields: ['usuario_id'] },
    { fields: ['referencia_id'] }
  ]
})

export default MovimientoCaja
