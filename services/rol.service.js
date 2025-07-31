import Rol from '../models/Rol.js';
import Permiso from '../models/Permiso.js';

export async function listarRolesService() {
  const roles = await Rol.findAll({
    attributes: ['id', 'nombre'],
    include: [{
      model: Permiso,
      attributes: ['id', 'nombre', 'descripcion'],
      through: { attributes: [] },  
      order: [['id', 'ASC']]  
    }]
  });

   
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

 
  const rol = await Rol.create({ nombre })

  if (permisos.length > 0) {
     
    const permisosEncontrados = await Permiso.findAll({
      where: { nombre: permisos }
    })
 
    await rol.setPermisos(permisosEncontrados)
  }

  return { success: true, message: 'Rol creado con permisos asignados', rol }
}

export async function actualizarRolService(id, { nombre, permisos = [] }) {
  const rol = await Rol.findByPk(id, { include: ['Permisos'] });

  if (!rol) throw { status: 404, message: 'Rol no encontrado' };

  const nombreOriginal = rol.nombre.toLowerCase();
  const esAdmin = nombreOriginal === 'admin' || nombreOriginal === 'administrador';

  // 🚫 No permitir modificar el nombre del rol si es admin
  if (esAdmin && nombre && nombre.toLowerCase() !== nombreOriginal) {
    throw { status: 403, message: 'No se permite cambiar el nombre del rol administrador.' };
  }

  // 🚫 No permitir modificar los permisos del rol admin
  if (esAdmin && permisos.length > 0) {
    throw { status: 403, message: 'No se permite modificar los permisos del rol administrador.' };
  }

  // Actualizar nombre si se permite
  if (nombre && !esAdmin) rol.nombre = nombre;

  await rol.save();

  // Actualizar permisos si se permiten
  if (!esAdmin && Array.isArray(permisos)) {
    const permisosEncontrados = await Permiso.findAll({
      where: { nombre: permisos }
    });
    await rol.setPermisos(permisosEncontrados);
  }

  return { success: true, message: 'Rol actualizado', rol };
}


export async function eliminarRolService(id) {
  const rol = await Rol.findByPk(id)
  if (!rol) throw { status: 404, message: 'Rol no encontrado' }

  if (rol.nombre.toLowerCase() === 'admin' || rol.nombre.toLowerCase() === 'administrador') {
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