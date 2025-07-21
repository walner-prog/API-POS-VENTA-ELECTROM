 import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'
 
 
 const InventarioLote = sequelize.define('InventarioLote', {


  
  fecha_caducidad: {
    type: DataTypes.DATE
  },
  cantidad: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  producto_id: {
  type: DataTypes.INTEGER,
  allowNull: false
},
fecha_ingreso: {
  type: DataTypes.DATE,
  defaultValue: DataTypes.NOW
}

}, {
  tableName: 'inventario_lotes',
  timestamps: true,
  indexes: [
    { fields: ['producto_id'] },
    { fields: ['fecha_caducidad'] }
  ]
})

export default InventarioLote


