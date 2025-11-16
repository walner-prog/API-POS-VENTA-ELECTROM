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
  compraRoutes,
  kpisRoutes,
  configuracionRoute,
  servicioRoutes,
  tiposServicioRoutes

} from './routes/index.js'
import './models/index.js'

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.use('/api/usuarios', usuarioRoutes)
app.use('/api/roles', rolRoutes)
app.use('/api/cajas', CajaRoutes)
app.use('/api/ventas', ventaRoutes)
app.use('/api/categorias', categoriaRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/egresos', egresoRoutes)
app.use('/api/productos', productoRoutes)
app.use('/api/reportes', reportesRoutes)
app.use('/api/claves-cancelacion', clavesCancelacionRoutes)
app.use('/api/ingresos', ingresoRoutes)
app.use('/api/compras', compraRoutes)
app.use('/api/kpis', kpisRoutes)
app.use('/api/configuracion', configuracionRoute)
app.use('/api/servicios', servicioRoutes)
app.use('/api/tipos-servicio', tiposServicioRoutes)

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
