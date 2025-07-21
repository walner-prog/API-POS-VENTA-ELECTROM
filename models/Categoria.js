import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Categoria = sequelize.define('Categoria', {
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  }
}, {
  tableName: 'categorias',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
})

export default Categoria
