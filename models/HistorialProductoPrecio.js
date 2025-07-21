import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const HistorialProducto = sequelize.define('HistorialProducto', {
    producto_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    campo: {
        type: DataTypes.STRING, // 'precio_venta', 'precio_compra', 'utilidad', etc.
        allowNull: false
    },
    valor_anterior: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    valor_nuevo: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    usuario_id: {
        type: DataTypes.INTEGER,  
        allowNull: true
    }
}, {
    tableName: 'historial_productos',
    timestamps: true
});

export default HistorialProducto;


