import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Producto = sequelize.define('Producto', {
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  codigo_barra: {
    type: DataTypes.STRING(50),
    unique: true
  },
  categoria_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  precio_compra: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  precio_venta: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  utilidad: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  unidad_medida: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  presentacion: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  venta_mayoreo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  precio_mayoreo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  minimo_mayoreo: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'productos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['codigo_barra'] },
    { fields: ['categoria_id'] }
  ]
})

export default Producto
