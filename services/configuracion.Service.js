import Configuracion from '../models/Configuracion.js'

// Obtener la configuración actual (única)
export async function obtenerConfiguracionService() {
  let config = await Configuracion.findOne()
  if (!config) {
    // Si no existe, la crea con valores por defecto
    config = await Configuracion.create({
      nombre_negocio: 'Pos Listo TPV',
      imprimir_recibo: true,
      moneda_simbolo: 'C$'
    })
  }
  return config
}

// Actualizar la configuración
export async function actualizarConfiguracionService(data) {
  let config = await Configuracion.findOne()
  if (!config) {
    config = await Configuracion.create(data)
  } else {
    await config.update(data)
  }
  return config
}
