import { Egreso } from '../models/index.js';

export default async function soloCreadorOAdmin(req, res, next) {
  const egreso = await Egreso.findByPk(req.params.egreso_id);

  if (!egreso) {
    return res.status(404).json({ success: false, message: 'Egreso no encontrado' });
  }

  const esCreador = egreso.usuario_id === req.usuario.id;
  const esAdmin = ['admin', 'administrador'].includes(req.usuario?.Rol?.nombre?.toLowerCase());

  if (!esCreador && !esAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Solo el creador o un administrador puede anular este egreso.'
    });
  }

  next();
}
