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
sequelize.authenticate()
  .then(() => {
    console.log('🎯 DB conectada')
    app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`))
  })
  .catch(err => console.error("Error DB:", err))
