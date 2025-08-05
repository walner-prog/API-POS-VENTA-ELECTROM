// models/ClaveCancelacion.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ClaveCancelacion = sequelize.define('ClaveCancelacion', {
  clave_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  expira_en: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'claves_cancelacion',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default ClaveCancelacion;
