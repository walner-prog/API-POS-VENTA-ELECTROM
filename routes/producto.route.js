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
  getProductosMasVendidos,
  getProductosMenosVendidos,
  listarMovimientosDeStock,
  obtenerCodigoBarras
} from '../controllers/producto.controller.js'
import { validarAgregarStock, validarRestarStock } from '../validator/productoStock.validation.js'
import authMiddleware from '../middlewares/auth.js'
import tienePermiso from '../middlewares/tienePermiso.js';
const router = express.Router();

router.post('/', authMiddleware('crear_productos'), crearProducto);
router.get('/:id/barcode', obtenerCodigoBarras);
router.put('/:id', authMiddleware, editarProducto);
router.get('/historial/precios/producto/:id', authMiddleware, obtenerHistorialProducto);
router.delete('/:id', authMiddleware, eliminarProducto);
router.get('/', authMiddleware, listarProductos);
router.get('/:id', authMiddleware, obtenerProductoPorIdController);
router.get('/todos/productos', authMiddleware, obtenerProductos);

router.post('/stock/agregar', authMiddleware,validarAgregarStock, agregarStockProducto);
router.post('/stock/restar', authMiddleware,validarRestarStock, restarStockProducto);
router.get('/stock/por-vencer', authMiddleware, productosPorVencer);
router.get('/mas-vendidos/en/plazo/30/dias', authMiddleware, getProductosMasVendidos);
router.get('/menos-vendidos/10/en/plazo/30/dias', authMiddleware, getProductosMenosVendidos);
router.get('/movimientos/stock/en/plazo/30/dias/p', authMiddleware, listarMovimientosDeStock);

export default router;
