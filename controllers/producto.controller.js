import * as productoService from '../services/producto.service.js';
import { crearProductoSchema, editarProductoSchema } from '../validator/producto.schema.js'
import { ValidationError } from 'sequelize'

export async function crearProducto(req, res) {
  try {
    const { error, value } = crearProductoSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        message: 'Error de validación',
        errors: error.details.map(d => ({ field: d.path[0], message: d.message }))
      })
    }

    const producto = await productoService.crearProductoService(value)
    res.status(201).json(producto)
  } catch (error) {
    console.error('Error al crear producto:', error)

    if (error instanceof ValidationError) {
      return res.status(400).json({
        message: 'Error de validación en la base de datos',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      })
    }

    res.status(error.status || 500).json({ message: error.message || 'Error al crear producto' })
  }
}

export async function editarProducto(req, res) {
  try {
    const { error, value } = editarProductoSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        message: 'Error de validación',
        errors: error.details.map(d => ({ field: d.path[0], message: d.message }))
      })
    }

    const producto = await productoService.editarProductoService(req.params.id, value)
    res.json(producto)
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Error al editar producto' })
  }
}


export async function eliminarProducto(req, res) {
  try {
    const result = await productoService.eliminarProductoService(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Error al eliminar producto' });
  }
}



export async function agregarStockProducto(req, res) {
  try {
    const { producto_id, cantidad } = req.body;
    const producto = await productoService.agregarStockProducto(producto_id, cantidad);
    res.status(201).json(producto);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Error al agregar stock' });
  }
}

export async function restarStockProducto(req, res) {
  try {
    const { producto_id, cantidad } = req.body;
    const producto = await productoService.restarStockProducto(producto_id, cantidad);
    res.json(producto);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Error al restar stock' });
  }
}


export async function listarProductos(req, res) {
  try {
    const {
      nombre,
      categoria_id,
      codigo_barra,
      pagina = 1,
      limite = 20
    } = req.query;

    const filtros = {
      nombre,
      categoria_id,
      codigo_barra
    };

    const paginacion = {
      pagina: parseInt(pagina),
      limite: parseInt(limite)
    };

    const productos = await productoService.listarProductosService(filtros, paginacion);
    res.json(productos);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Error al listar productos' });
  }
}

export async function productosPorVencer(req, res) {
  try {
    const diasAviso = req.query.diasAviso ? Number(req.query.diasAviso) : 7;
    const lotes = await productoService.productosPorVencer(diasAviso);
    res.json(lotes);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Error al obtener productos por vencer' });
  }
}

export async function obtenerHistorialProducto(req, res) {

  try {
    const historial = await productoService.obtenerHistorialProducto(req.params.id);
    res.json(historial);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Error al obtener historial de precios' });
  }  
}
