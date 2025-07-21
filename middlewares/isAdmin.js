export default function isAdmin(req, res, next) {
  const rolUsuario = req.usuario?.Rol?.nombre?.toLowerCase()

  if (rolUsuario !== 'admin' && rolUsuario !== 'administrador') {
    return res.status(403).json({
      success: false,
      message: 'Solo admin puede realizar esta acción'
    })
  }

  next()
}
