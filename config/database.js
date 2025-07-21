import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'
dotenv.config()

// Desestructuramos las variables de entorno correctamente
const {
  MYSQLHOST,
  MYSQLPORT,
  MYSQLUSER,
  MYSQLPASSWORD,
  MYSQLDATABASE
} = process.env

console.log('🔍 VARIABLES DB: ', {
  MYSQLHOST,
  MYSQLPORT,
  MYSQLUSER,
  MYSQLPASSWORD,
  MYSQLDATABASE
})

if (!MYSQLHOST || !MYSQLPORT || !MYSQLUSER || !MYSQLPASSWORD || !MYSQLDATABASE) {
  throw new Error('❌ Variables MySQL no definidas. Verificá el .env o Railway > Variables')
}

const sequelize = new Sequelize(MYSQLDATABASE, MYSQLUSER, MYSQLPASSWORD, {
  host: MYSQLHOST,
  port: MYSQLPORT,
  dialect: 'mysql',
  logging: false,
})

export default sequelize
