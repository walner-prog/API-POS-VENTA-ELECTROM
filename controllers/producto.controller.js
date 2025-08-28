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
    const data = req.body;

    // Aquí podrías validar manualmente si es necesario, pero en este caso se omite
    const producto = await productoService.editarProductoService(req.params.id, data);

    res.json(producto);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Error al editar producto' });
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
    const { producto_id, cantidad, tipo_movimiento, observaciones } = req.body;

    // Llamamos al servicio pasando los nuevos parámetros
    const producto = await productoService.agregarStockProducto(
      producto_id,
      cantidad,
      tipo_movimiento,
      observaciones
    );

    res.status(201).json(producto);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Error al agregar stock' });
  }
}


export async function restarStockProducto(req, res) {
  try {
    const { producto_id, cantidad, tipo_movimiento, observaciones } = req.body;

    // Llamamos al servicio pasando los nuevos parámetros
    const producto = await productoService.restarStockProducto(
      producto_id,
      cantidad,
      tipo_movimiento,
      observaciones
    );

    res.json(producto);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Error al restar stock' });
  }
}


export async function listarProductos(req, res) {
  try {
    const {
      busqueda,
      categoria_id,
      pagina = 1,
      limite = 20
    } = req.query;

    const filtros = {
      busqueda,
      categoria_id
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


 

export async function obtenerProductoPorIdController(req, res) {
  try {
    const { id } = req.params;
    const producto = await productoService.obtenerProductoPorIdService(id);
    res.json(producto);
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || 'Error al obtener producto'
    });
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

export async function obtenerProductos(req, res) {

  try {
    const productos = await productoService.obtenerProductosTodos();
    res.json(productos);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Error al obtener productos' });
  }
}


export const getProductosMasVendidos = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query  // incluye búsqueda opcional

    const productosVendidos = await productoService.obtenerProductosMasVendidos(
      parseInt(page),
      parseInt(limit),
      search
    )

    if (!productosVendidos || productosVendidos.length === 0) {
      return res.status(404).json({ message: "No se encontraron ventas en los últimos 30 días." })
    }

    res.status(200).json({
      page: parseInt(page),
      limit: parseInt(limit),
      data: productosVendidos
    })
  } catch (error) {
    console.error('Error en el controlador de productos más vendidos:', error)
    res.status(500).json({ message: 'Error interno del servidor al generar el reporte.' })
  }
}

 export const getProductosMenosVendidos = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query

    const productos = await productoService.obtenerProductosMenosVendidos(
      parseInt(page),
      parseInt(limit),
      search
    )

    if (!productos || productos.length === 0) {
      return res.status(404).json({ message: "No se encontraron ventas en los últimos 30 días." })
    }

    res.status(200).json({
      page: parseInt(page),
      limit: parseInt(limit),
      data: productos
    })
  } catch (error) {
    console.error('Error en el controlador de productos menos vendidos:', error)
    res.status(500).json({ message: 'Error interno del servidor al generar el reporte.' })
  }
}

 

export async function listarMovimientosDeStock(req, res) {
  try {
    const { page, limit, busqueda, tipo_movimiento } = req.query;

    const data = await productoService.listarMovimientosStock({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      busqueda: busqueda || '',
      tipo_movimiento: tipo_movimiento || null
    });

    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al listar movimientos de stock' });
  }
}




