import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DetalleVentaLote = sequelize.define('DetalleVentaLote', {
  detalle_venta_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  inventario_lote_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  tableName: 'detalle_venta_lotes',
  timestamps: false
});

export default DetalleVentaLote;
