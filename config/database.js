import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

// Solo carga .env si no estás en producción
if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

console.log('🧪 ENV TEST:', process.env.MYSQLHOST)

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
  throw new Error('❌ Variables MySQL no definidas. Verificá el .env o configura las variables en Railway / entorno producción')
}

const sequelize = new Sequelize(MYSQLDATABASE, MYSQLUSER, MYSQLPASSWORD, {
  host: MYSQLHOST,
  port: Number(MYSQLPORT),
  dialect: 'mysql',
  logging: false,
})

export default sequelize
