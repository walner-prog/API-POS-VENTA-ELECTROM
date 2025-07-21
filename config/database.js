import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'
dotenv.config() // ¡Asegurate que esto se ejecuta antes de acceder a process.env!

const url = process.env.MYSQL_URL

if (!url) {
  throw new Error('MYSQL_URL no está definida. Verificá el .env')
}

const sequelize = new Sequelize(url, {
  dialect: 'mysql',
  logging: false,
})

export default sequelize
