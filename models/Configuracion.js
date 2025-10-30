import { DataTypes } from 'sequelize'
import sequelize from '../config/database.js'

const Configuracion = sequelize.define('Configuracion', {
  nombre_negocio: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  logo_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  telefono: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  direccion: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  ruc: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  correo: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  imprimir_recibo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  mensaje_recibo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  impuesto_iva: {
    type: DataTypes.DECIMAL(5,2),
    allowNull: true,
    defaultValue: 0.00
  },
  moneda_simbolo: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: "C$"
  }
}, {
  tableName: 'configuraciones',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})

export default Configuracion
