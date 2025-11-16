// models/TipoServicio.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TipoServicio = sequelize.define('TipoServicio', {
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'tipos_servicios',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: true, // soft delete
  deletedAt: 'deleted_at'
});

export default TipoServicio;
