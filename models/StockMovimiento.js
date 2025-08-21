import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
 

const StockMovimiento = sequelize.define('StockMovimiento', {
  
  tipo_movimiento: {
    type: DataTypes.ENUM('compra', 'venta', 'ajuste', 'devolucion', 'otro','Dañado','Perdido'),
    allowNull: false,
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  stock_anterior: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  stock_nuevo: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  referencia_tipo: {
    type: DataTypes.ENUM('egreso', 'venta', 'ajuste', 'otro', 'compra','devolucion','Dañado','Perdido'),
    allowNull: true,
  },
  referencia_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  
  observaciones: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'stock_movimientos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});



export default StockMovimiento;
