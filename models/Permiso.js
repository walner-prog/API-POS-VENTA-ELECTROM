import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Permiso = sequelize.define('Permiso', {
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'permisos',
  timestamps: false
})

export default Permiso
