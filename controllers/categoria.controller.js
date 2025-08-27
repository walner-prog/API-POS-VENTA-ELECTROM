import {
  listarCategoriasService,
  crearCategoriaService,
  actualizarCategoriaService,
  eliminarCategoriaService,
  listarCategoriasPorIdProductoService
} from '../services/categoria.service.js'

export const listarCategorias = async (req, res) => {
  try {
    const categorias = await listarCategoriasService();
    res.json({ success: true, data: categorias });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export const listarCategoriasPorIdProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const categorias = await listarCategoriasPorIdProductoService(id);
    res.json({ success: true, data: categorias });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export const crearCategoria = async (req, res) => {
  try {
    const { nombre } = req.body;
    const categoria = await crearCategoriaService(nombre);
    res.json({ success: true, message: 'Categoría creada correctamente.', categoria });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export const actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    const categoria = await actualizarCategoriaService(id, nombre);
    res.json({ success: true, message: 'Categoría actualizada correctamente.', categoria });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}

export const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    await eliminarCategoriaService(id);
    res.json({ success: true, message: 'Categoría eliminada correctamente.' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
}
