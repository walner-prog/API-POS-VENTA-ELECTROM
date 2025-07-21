import express from 'express'
import { listarTicketsPorCaja,anularTicket,eliminarTicketsCaja } from '../controllers/ticket.controller.js'
import authMiddleware from '../middlewares/auth.js'
const router = express.Router()

// GET /api/tickets/caja/:caja_id
router.get('/caja/:caja_id', authMiddleware, listarTicketsPorCaja)
router.put('/anular/:ticket_id', authMiddleware, anularTicket)
router.delete('/eliminar/:caja_id', authMiddleware, eliminarTicketsCaja)

export default router
