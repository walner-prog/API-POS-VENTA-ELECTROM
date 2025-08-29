import Usuario from '../models/Usuario.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Rol from '../models/Rol.js'; 
import Permiso from '../models/Permiso.js';
import Caja from '../models/caja.js';
import Venta from '../models/Venta.js';
import sequelize from "../config/database.js";

import { Op } from "sequelize"; // o en CommonJS: const { Op } = require('sequelize');



const JWT_SECRET = process.env.JWT_SECRET || '5W4W5R9W0D6S4W9W7SD5SSDQRE';

export async function registrarUsuarioService({
  email,
  nombre,
  password,
  role_id
}) {
  const t = await sequelize.transaction();
  try {
    if (!nombre || !password) throw {
      status: 400,
      message: 'Nombre y password son requeridos'
    };

    const existe = await Usuario.findOne({ where: { nombre }, transaction: t });
    if (existe) throw {
      status: 409,
      message: 'Nombre ya registrado'
    };

    let rol;
    if (!role_id) {
      rol = await Rol.findOne({ where: { nombre: 'usuario' }, transaction: t });
      if (!rol) throw {
        status: 400,
        message: 'Rol por defecto llamado "usuario" no encontrado'
      };
    } else {
      rol = await Rol.findByPk(role_id, { transaction: t });
      if (!rol) throw {
        status: 400,
        message: 'Rol inválido'
      };
    }

    const rolNombre = rol.nombre.toLowerCase().trim();

    if (['admin', 'administrador'].includes(rolNombre)) {
      const yaExiste = await Usuario.findOne({
        where: { role_id: rol.id },
        transaction: t
      });

      if (yaExiste) {
        throw {
          status: 403,
          message: `Ya existe un usuario con rol ${rolNombre}`
        };
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await Usuario.create({
      email,
      nombre,
      password: passwordHash,
      role_id: rol.id
    }, { transaction: t });

    await t.commit();

    return {
      success: true,
      message: 'Usuario registrado'
    };

  } catch (error) {
    await t.rollback();
    throw error;
  }
}




export async function loginUsuarioService({ nombre, password }) {
  if (!nombre || !password) throw {
    status: 400,
    message: 'nombre y password son requeridos'
  };

  const usuario = await Usuario.findOne({
    where: { nombre },
    include: {
      model: Rol,
      attributes: ['nombre'] // solo traemos el rol, no los permisos
    }
  });

  if (!usuario) throw {
    status: 404,
    message: 'Usuario no encontrado'
  };

  const valido = await bcrypt.compare(password, usuario.password);
  if (!valido) throw {
    status: 401,
    message: 'Contraseña incorrecta'
  };

  const token = jwt.sign(
    {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.Rol.nombre
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  return {
    success: true,
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.Rol.nombre
    }
  };
}





export async function actualizarUsuarioService(id, {
  nombre,
  email,
  password,
  role_id
}, usuarioActualId, usuarioActualRol) {
  const usuario = await Usuario.findByPk(id, {
    include: Rol
  });
  if (!usuario) throw {
    status: 404,
    message: 'Usuario no encontrado'
  };

  // Evitar que admin cambie su propio rol
  if (usuario.id === usuarioActualId && usuarioActualRol === 'admin' && role_id && role_id !== usuario.role_id) {
    throw {
      status: 403,
      message: 'No puedes cambiar tu propio rol'
    };
  }

  // ❌ Si el admin intenta darle rol "admin" a otro usuario
  if (role_id !== usuario.role_id && role_id === 1 && usuario.id !== usuarioActualId) {
    throw {
      status: 403,
      message: 'No puedes asignar el rol de administrador a otro usuario.'
    };
  }

  usuario.nombre = nombre || usuario.nombre;
  usuario.email = email || usuario.email;
  usuario.role_id = role_id;

  if (password) {
    usuario.password = await bcrypt.hash(password, 10);
  }

  if (role_id) {
    const rol = await Rol.findByPk(role_id);
    if (!rol) throw {
      status: 400,
      message: 'Rol inválido'
    };
    usuario.role_id = role_id;
  }

  await usuario.save();
  return {
    success: true,
    message: 'Usuario actualizado'
  };
}


export async function eliminarUsuarioService(id) {
  const usuario = await Usuario.findByPk(id, {
    include: {
      model: Rol,
      attributes: ['nombre'], // trae solo el nombre del rol
    }
  });

  if (!usuario) {
    throw { status: 404, message: 'Usuario no encontrado' };
  }

  const rolNombre = usuario.Rol?.nombre?.toLowerCase();

  // No permitir eliminar administradores
  if (['admin', 'administrador'].includes(rolNombre)) {
    throw {
      status: 403,
      message: `No se puede eliminar un usuario con rol ${rolNombre}`
    };
  }

  // Verificar si tiene cajas asociadas
  const cajasAsociadas = await Caja.count({ where: { usuario_id: id } });
  if (cajasAsociadas > 0) {
    throw {
      status: 409,
      message: 'No se puede eliminar este usuario porque tiene cajas asociadas.'
    };
  }

  // Verificar si tiene ventas asociadas
  const ventasAsociadas = await Venta.count({ where: { usuario_id: id } });
  if (ventasAsociadas > 0) {
    throw {
      status: 409,
      message: 'No se puede eliminar este usuario porque tiene ventas registradas.'
    };
  }

  await usuario.destroy();

  return { success: true, message: 'Usuario eliminado correctamente' };
}




export async function verPerfilService(id) {
  const usuario = await Usuario.findByPk(id, {
    attributes: ['id', 'email', 'nombre', 'creado_en'],
    include: [
      {
        model: Rol,
        attributes: ['nombre']
      }
    ]
  });

  if (!usuario) throw {
    status: 404,
    message: 'Perfil no encontrado'
  };

  return {
    success: true,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      creado_en: usuario.creado_en,
      rol: usuario.Rol?.nombre || 'usuario' // ⚡ Incluimos el rol
    }
  };
}


export async function listarUsuariosService(pagina = 1, busqueda = '') {
  const limite = 5;
  const offset = (pagina - 1) * limite;

  const where = busqueda
    ? {
        [Op.or]: [
          { nombre: { [Op.like]: `%${busqueda}%` } },
          { email: { [Op.like]: `%${busqueda}%` } }
        ]
      }
    : {};

  const { count, rows } = await Usuario.findAndCountAll({
    attributes: ['id', 'nombre', 'email'],
    where,
    limit: limite,
    offset,
    distinct: true,      // <-- Agregar esta línea
    include: [
      {
        model: Rol,
        attributes: ['nombre'],
        include: [
          {
            model: Permiso,
            attributes: ['nombre'],
            through: { attributes: [] }
          }
        ]
      }
    ]
  });

  return {
    success: true,
    usuarios: rows,
    total: count
  };
}



export async function cambiarPasswordService(id, {
  actualPassword,
  nuevaPassword
}) {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) throw {
    status: 404,
    message: 'Usuario no encontrado'
  };

  const valido = await bcrypt.compare(actualPassword, usuario.password);
  if (!valido) throw {
    status: 401,
    message: 'Contraseña actual incorrecta'
  };

  usuario.password = await bcrypt.hash(nuevaPassword, 10);
  await usuario.save();
  return {
    success: true,
    message: 'Contraseña actualizada'
  };
}

export async function recuperarCuentaService(email, nuevaPassword) {
  const usuario = await Usuario.findOne({ where: { email } });
  if (!usuario) {
    return { success: false, message: "Correo no registrado" };
  }

  const hash = await bcrypt.hash(nuevaPassword, 10);
  usuario.password = hash;
  await usuario.save();

  return {
    success: true,
    message: "Contraseña actualizada correctamente"
  };
}




export async function registrarUsuarioComoAdminService({
  creador_id, // ID del usuario que intenta crear al nuevo usuario
  email,
  nombre,
  password,
  role_id
}) {
  if (!nombre || !password || !creador_id) throw {
    status: 400,
    message: 'Datos requeridos faltantes'
  };

  // Verificar que el creador existe y tiene rol adecuado
  const creador = await Usuario.findByPk(creador_id, {
    include: { model: Rol }
  });

  if (!creador || !['admin', 'administrador'].includes(creador.Rol.nombre.toLowerCase())) {
    throw {
      status: 403,
      message: 'No tiene permisos para crear usuarios'
    };
  }

  // Verificar que el nombre del nuevo usuario no esté repetido
  const yaExiste = await Usuario.findOne({ where: { nombre } });
  if (yaExiste) throw {
    status: 409,
    message: 'Nombre ya registrado'
  };

  // Verificar que el rol destino exista
  const rol = await Rol.findByPk(role_id);
  if (!rol) throw {
    status: 400,
    message: 'Rol inválido'
  };

  // Validar que si el rol a crear es admin o administrador, no exista ya uno en la BD
  if (['admin', 'administrador'].includes(rol.nombre.toLowerCase())) {
    const existeAdmin = await Usuario.findOne({
      include: {
        model: Rol,
        where: {
          nombre: rol.nombre
        }
      }
    });
    if (existeAdmin) {
      throw {
        status: 409,
        message: `Ya existe un usuario con rol ${rol.nombre}`
      };
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await Usuario.create({
    email,
    nombre,
    password: passwordHash,
    role_id: rol.id
  });

  return {
    success: true,
    message: `Usuario con rol ${rol.nombre} creado exitosamente`
  };
}


export async function obtenerUsuarioPorIdService(id) {
  const usuario = await Usuario.findByPk(id, {
    attributes: ['id', 'nombre', 'email', 'role_id'],
    include: {
      model: Rol,
      attributes: ['id', 'nombre']
    }
  });

  if (!usuario) {
    throw { status: 404, message: 'Usuario no encontrado' };
  }

  return usuario;
}
 