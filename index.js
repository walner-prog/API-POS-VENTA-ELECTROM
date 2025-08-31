import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

import sequelize from './config/database.js'
import {
  usuarioRoutes,
  rolRoutes,
  CajaRoutes,
  ventaRoutes,
  categoriaRoutes,
  ticketRoutes,
  egresoRoutes,
  productoRoutes,
  reportesRoutes,
  clavesCancelacionRoutes,
  ingresoRoutes,
  compraRoutes
} from './routes/index.js'
import './models/index.js'

const app = express()
app.use(cors())

// Solo para rutas JSON puro
app.use('/api/usuarios', bodyParser.json(), usuarioRoutes)
app.use('/api/roles', bodyParser.json(), rolRoutes)
app.use('/api/cajas', bodyParser.json(), CajaRoutes)
app.use('/api/ventas', bodyParser.json(), ventaRoutes)
app.use('/api/categorias', bodyParser.json(), categoriaRoutes)
app.use('/api/tickets', bodyParser.json(), ticketRoutes)
app.use('/api/egresos', bodyParser.json(), egresoRoutes)
app.use('/api/productos', bodyParser.json(), productoRoutes)
app.use('/api/reportes', bodyParser.json(), reportesRoutes)
app.use('/api/claves-cancelacion', bodyParser.json(), clavesCancelacionRoutes)
app.use('/api/ingresos', bodyParser.json(), ingresoRoutes)

// **Compras con Multer** (archivos grandes)
app.use('/api/compras', compraRoutes)

app.get('/', (req, res) => res.send('API POS funcionando 🚀'))

const PORT = process.env.PORT || 3000

if (process.env.NODE_ENV !== 'production') {
  console.log('🌍 Entorno:', process.env.NODE_ENV)
  console.log('🔧 Puerto:', PORT)
}

const startServer = async () => {
  let retries = 5
  while (retries > 0) {
    try {
      await sequelize.authenticate()
      console.log('🎯 DB conectada')
      await sequelize.sync({ alter: false })
      app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`))
      break
    } catch (err) {
      retries--
      console.error(`❌ Error DB, reintentando en 5 segundos... (${retries} intentos restantes)`)
      console.error(`⛔ ${err.message}`)
      await new Promise(res => setTimeout(res, 5000))
    }
  }

  if (retries === 0) {
    console.error('❌ No se pudo conectar a la DB. Cerrando app.')
    process.exit(1)
  }
}

startServer()
