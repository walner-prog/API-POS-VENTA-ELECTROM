// middlewares/tienePermiso.js
export default function tienePermiso(nombrePermiso) {
  return (req, res, next) => {
    const permisos = req.usuario?.Rol?.Permisos?.map(p => p.nombre) || [];
   

    if (!permisos.includes(nombrePermiso)) {
      return res.status(403).json({
        success: false,
        message: 'No tenés permiso para esta acción'
      });
    }
 
    next();
  };
}
