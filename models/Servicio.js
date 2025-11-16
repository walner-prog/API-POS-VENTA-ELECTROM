// models/Servicio.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Servicio = sequelize.define('Servicio', {
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  // para soft-delete / estado extra
  estado: {
    type: DataTypes.ENUM('activo','anulado'),
    defaultValue: 'activo'
  }
}, {
  tableName: 'servicios',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: true,
  deletedAt: 'deleted_at'
});

export default Servicio;
