import express from 'express';
import { 
  crearProducto, 
  editarProducto, 
  eliminarProducto, 
  listarProductos, 
  agregarStockProducto, 
  restarStockProducto, 
  productosPorVencer ,
  obtenerHistorialProducto
} from '../controllers/producto.controller.js'
import { validarAgregarStock, validarRestarStock } from '../validator/productoStock.validation.js'
import authMiddleware from '../middlewares/auth.js'
import tienePermiso from '../middlewares/tienePermiso.js';
const router = express.Router();

router.post('/', authMiddleware, tienePermiso('crear_productos'), crearProducto);
router.put('/:id', authMiddleware, editarProducto);
router.get('/historial/precios/producto/:id', authMiddleware, obtenerHistorialProducto);
router.delete('/:id', authMiddleware, eliminarProducto);
router.get('/', authMiddleware, listarProductos);

router.post('/stock/agregar', authMiddleware,validarAgregarStock, agregarStockProducto);
router.post('/stock/restar', authMiddleware,validarRestarStock, restarStockProducto);
router.get('/stock/por-vencer', authMiddleware, productosPorVencer);

export default router;
