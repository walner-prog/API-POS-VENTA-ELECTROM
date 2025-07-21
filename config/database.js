import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

// Solo carga .env si no estás en producción
if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

// Extrae variables del entorno
const {
  MYSQLHOST,
  MYSQLPORT,
  MYSQLUSER,
  MYSQLPASSWORD,
  MYSQLDATABASE
} = process.env

// Validación de variables
if (!MYSQLHOST || !MYSQLPORT || !MYSQLUSER || !MYSQLPASSWORD || !MYSQLDATABASE) {
  throw new Error('❌ Variables MySQL no definidas. Verificá el .env o configura las variables en Railway / entorno producción')
}

// Log solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
  console.log('🔍 DB Config:', {
    MYSQLHOST,
    MYSQLPORT,
    MYSQLUSER,
    MYSQLDATABASE,
    NODE_ENV: process.env.NODE_ENV
  })
}

// Conexión Sequelize
const sequelize = new Sequelize(MYSQLDATABASE, MYSQLUSER, MYSQLPASSWORD, {
  host: MYSQLHOST,
  port: Number(MYSQLPORT),
  dialect: 'mysql',
  logging: false,
})

export default sequelize
