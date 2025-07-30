import Rol from '../models/Rol.js';
import Permiso from '../models/Permiso.js';

export async function listarRolesService() {
  const roles = await Rol.findAll({
    attributes: ['id', 'nombre'],
    include: [{
      model: Permiso,
      attributes: ['id', 'nombre', 'descripcion'],
      through: { attributes: [] }, // para no incluir la tabla intermedia RolPermiso
      order: [['id', 'ASC']] // esto no funciona aquí directamente
    }]
  });

  // Ordenar permisos manualmente por id (opcional pero recomendado)
  const rolesConPermisosOrdenados = roles.map(rol => {
    rol.Permisos = rol.Permisos.sort((a, b) => a.id - b.id);
    return rol;
  });

  return { success: true, roles: rolesConPermisosOrdenados };
}


export async function crearRolService({ nombre, permisos = [] }) {
  if (!nombre) throw { status: 400, message: 'Nombre es requerido' }

  const existe = await Rol.findOne({ where: { nombre } })
  if (existe) throw { status: 409, message: 'El rol ya existe' }

  // Crear rol nuevo
  const rol = await Rol.create({ nombre })

  if (permisos.length > 0) {
    // Buscar los permisos por nombre (o podés usar ids si prefieres)
    const permisosEncontrados = await Permiso.findAll({
      where: { nombre: permisos }
    })

    // Asignar permisos al rol
    await rol.setPermisos(permisosEncontrados)
  }

  return { success: true, message: 'Rol creado con permisos asignados', rol }
}

export async function actualizarRolService(id, { nombre, permisos = [] }) {
  const rol = await Rol.findByPk(id, { include: ['Permisos'] }); // Incluye los permisos actuales

  if (!rol) throw { status: 404, message: 'Rol no encontrado' };

  // Actualizar nombre si se proporciona
  if (nombre) rol.nombre = nombre;

  await rol.save();

  // Actualizar los permisos si se proporcionan
  if (Array.isArray(permisos)) {
    const permisosEncontrados = await Permiso.findAll({
      where: { nombre: permisos }
    });

    await rol.setPermisos(permisosEncontrados); // Reemplaza los permisos actuales
  }

  return { success: true, message: 'Rol actualizado', rol };
}


export async function eliminarRolService(id) {
  const rol = await Rol.findByPk(id)
  if (!rol) throw { status: 404, message: 'Rol no encontrado' }

  if (rol.nombre.toLowerCase() === 'admin') {
    throw { status: 403, message: 'No se puede eliminar el rol admin' }
  }

  await rol.destroy()
  return { success: true, message: 'Rol eliminado' }
}

export async function listarPermisosService() {
  const permisos = await Permiso.findAll({
    attributes: ['id', 'nombre', 'descripcion'],
    order: [['id', 'ASC']]
  })
  return permisos
}