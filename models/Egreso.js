import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Egreso = sequelize.define('Egreso', {
  tipo: {
    type: DataTypes.ENUM('compra_productos', 'gasto_comunes', 'gastos_especiales','mantenimiento','salarios','otro'),
    allowNull: false
  },
  referencia: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  monto: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING(255)
  },
  factura_imagen: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  metodo_pago: {
    type: DataTypes.ENUM('efectivo'),
    defaultValue: 'efectivo'
  },
  anulado_por: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('activo', 'anulado'),
    defaultValue: 'activo'
  },
  anulado_en: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'egresos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
})

export default Egreso
