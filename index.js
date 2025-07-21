import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import sequelize from './config/database.js'
import {
  usuarioRoutes,
  rolRoutes,
  CajaRoutes,
  ventaRoutes,
  categoriaRoutes,
  ticketRoutes,
  egresoRoutes,
  productoRoutes
} from './routes/index.js'
import './models/index.js'

dotenv.config()

const app = express()
app.use(cors()) // ESTO HABILITA CORS PARA TODOS LOS ORÍGENES
app.use(bodyParser.json())

app.use('/api/usuarios', usuarioRoutes)
app.use('/api/roles', rolRoutes)
app.use('/api/cajas', CajaRoutes)
app.use('/api/ventas', ventaRoutes)
app.use('/api/categorias', categoriaRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/egresos', egresoRoutes)
app.use('/api/productos', productoRoutes)

app.get('/', (req, res) => res.send('API Pos funcionando 🚀'))

// Conectar a la DB y arrancar servidor
const PORT = process.env.PORT || 3000

const startServer = async () => {
  let retries = 5
  while (retries > 0) {
    try {
      await sequelize.authenticate()
      console.log('🎯 DB conectada')
      await sequelize.sync({ alter: false }) // crea tablas si no existen
      app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`))
      break
    } catch (err) {
      retries--
      console.error(`❌ Error DB, reintentando en 5 segundos... (${retries} intentos restantes)`)
  console.error(`⛔ ${err.message}`, err)

      await new Promise(res => setTimeout(res, 5000))
    }
  }
  if (retries === 0) {
    console.error('❌ No se pudo conectar a la DB. Cerrando app.')
    process.exit(1)
  }
}

startServer()
