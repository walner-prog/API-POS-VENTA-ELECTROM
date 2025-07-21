import { listarTicketsPorCajaService,anularTicketService,eliminarTicketsCajaService } from '../services/ticket.service.js'
 
export const listarTicketsPorCaja = async (req, res) => {
  try {
    const { caja_id } = req.params
    const usuario_id = req.usuario.id // del authMiddleware
    const data = await listarTicketsPorCajaService(caja_id, usuario_id)
    res.json(data)
  } catch (error) {
    console.error('Error en listarTicketsPorCaja:', error)
    res.status(error.status || 500).json({ success: false, message: error.message || 'Error interno' })
  }
}


// ESTA FUNCION NO SE USA EN NINGUN LADO, PERO SE DEJA POR SI SE NECESITA EN EL FUTURO
export const anularTicket = async (req, res) => {
  try {
    const { ticket_id } = req.params
    const { observacion } = req.body
    const usuario_id = req.usuario.id // supondremos que usás auth y el ID del usuario está en el token

    const ticketAnulado = await anularTicketService(ticket_id, observacion, usuario_id)
    res.json({ success: true, message: 'Ticket anulado correctamente.', ticket: ticketAnulado })
  } catch (error) {
    console.error('Error al anular ticket:', error)
    res.status(error.status || 500).json({ success: false, message: error.message || 'Error al anular ticket.' })
  }
}


export async function eliminarTicketsCaja(req, res) {
  try {
    const caja_id = req.params.caja_id
    const usuario_id = req.usuario.id // del authMiddleware

    const resultado = await eliminarTicketsCajaService(caja_id, usuario_id)

    res.json(resultado)
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message })
  }
}


