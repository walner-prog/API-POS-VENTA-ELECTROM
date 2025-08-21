import express from 'express';
import { 
  crearProducto, 
  editarProducto, 
  eliminarProducto, 
  listarProductos, 
  agregarStockProducto, 
  restarStockProducto, 
  productosPorVencer ,
  obtenerHistorialProducto,
  obtenerProductoPorIdController,
  obtenerProductos,
  getProductosMasVendidos
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
router.get('/:id', authMiddleware, obtenerProductoPorIdController);
router.get('/todos/productos', authMiddleware, obtenerProductos);

router.post('/stock/agregar', authMiddleware,validarAgregarStock, agregarStockProducto);
router.post('/stock/restar', authMiddleware,validarRestarStock, restarStockProducto);
router.get('/stock/por-vencer', authMiddleware, productosPorVencer);
router.get('/mas-vendidos/en/plazo/15/dias', authMiddleware, getProductosMasVendidos);

export default router;
