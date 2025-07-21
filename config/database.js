import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

// Solo carga .env si no estás en producción
if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

// Aquí agrega para debuggear:
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('TODAS variables:', Object.keys(process.env))
console.log('MYSQLHOST:', process.env.MYSQLHOST)
console.log('MYSQLPORT:', process.env.MYSQLPORT)
console.log('MYSQLUSER:', process.env.MYSQLUSER)
console.log('MYSQLPASSWORD:', process.env.MYSQLPASSWORD)
console.log('MYSQLDATABASE:', process.env.MYSQLDATABASE)

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


console.log('✅ Variables definidas en Railway:')
Object.entries(process.env).forEach(([key, value]) => {
  if (key.startsWith('MYSQL') || key.startsWith('RAILWAY')) {
    console.log(`${key}: ${value}`)
  }
})


export default sequelize
