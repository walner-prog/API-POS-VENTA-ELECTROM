import jwt from 'jsonwebtoken';
import { Usuario, Rol, Permiso } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || '5W4W5R9W0D6S4W9W7SD5SSDQRE';

export default async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

const usuario = await Usuario.findByPk(decoded.id, {
  attributes: ['id', 'nombre', 'email'],
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

    if (!usuario) {
      return res.status(401).json({ success: false, message: 'Usuario no válido' });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
}
