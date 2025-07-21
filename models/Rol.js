import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Rol = sequelize.define('Rol', {
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false
  }
}, {
  tableName: 'roles',
  timestamps: false
})

export default Rol
