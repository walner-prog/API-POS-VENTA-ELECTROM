import Categoria from '../models/Categoria.js'
import Producto from '../models/Producto.js'

export async function listarCategoriasService() {
  return await Categoria.findAll({ order: [['created_at', 'DESC']] });
}

export async function crearCategoriaService(nombre) {
  try {
    return await Categoria.create({ nombre });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw { status: 400, message: 'Ya existe una categoría con ese nombre.' };
    }
    throw error;
  }
}

export async function actualizarCategoriaService(id, nombre) {
  try {
    const categoria = await Categoria.findByPk(id);
    if (!categoria) throw { status: 404, message: 'Categoría no encontrada.' };

    categoria.nombre = nombre;
    await categoria.save();
    return categoria;
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw { status: 400, message: 'Ya existe una categoría con ese nombre.' };
    }
    throw error;
  }
}

export async function eliminarCategoriaService(id) {
  const productos = await Producto.count({ where: { categoria_id: id } });
  if (productos > 0) {
    throw { status: 400, message: 'No se puede eliminar la categoría porque está asignada a uno o más productos.' };
  }

  const eliminado = await Categoria.destroy({ where: { id } });
  if (!eliminado) throw { status: 404, message: 'Categoría no encontrada.' };
  return true;
}
