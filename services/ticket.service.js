import { Caja, Venta, Ticket, DetalleVenta, Producto } from '../models/index.js'
import { Op } from 'sequelize'
import { getCurrentTimeInTimezone, NICARAGUA_OFFSET_MINUTES } from '../utils/dateUtils.js';

 // Esta función lista todos los tickets de una caja 

export async function listarTicketsPorCajaService(caja_id) {
   // Aplicamos la zona horaria correcta para la validación
    const nowNicaragua = getCurrentTimeInTimezone(NICARAGUA_OFFSET_MINUTES);
    const fechaLimite = new Date(nowNicaragua);
    fechaLimite.setDate(fechaLimite.getDate() - 31);
    // Para simplificar, la hora de `fechaLimite` debe ser la medianoche del día límite
    fechaLimite.setHours(0, 0, 0, 0);

    const caja = await Caja.findByPk(caja_id);
    if (!caja) throw { status: 404, message: 'Caja no encontrada.' };

    // --- Validación corregida ---
    // Verificamos si la fecha de creación de la caja es anterior a la fecha límite de 30 días.
    if (new Date(caja.created_at) < fechaLimite) {
        throw { status: 403, message: 'Caja fuera del rango de 30 días.' };
    }
    // Esta consulta trae TODAS las ventas de la caja, sin filtro de fecha
    const ventas = await Venta.findAll({
        where: { caja_id: caja.id },
        attributes: ['id']
    });

    const idsVentas = ventas.map(v => v.id);
    if (idsVentas.length === 0) {
        return {
            resumen: {
                total_tickets: 0,
                vendidos: 0,
                anulados: 0,
                total_cordobas: "0.00"
            },
            tickets: []
        };
    }

    const tickets = await Ticket.findAll({
        where: { venta_id: { [Op.in]: idsVentas } },
        include: [
            {
                model: Venta,
                attributes: ['total', 'created_at'],
                include: [{
                    model: DetalleVenta,
                    include: [{
                        model: Producto,
                        attributes: ['nombre']
                    }]
                }]
            }
        ],
        order: [['created_at', 'DESC']]
    });

    let vendidos = 0, anulados = 0, total_cordobas = 0;
    tickets.forEach(ticket => {
        if (ticket.estado === 'vendido') {
            vendidos++;
            total_cordobas += parseFloat(ticket.Ventum.total);
        } else if (ticket.estado === 'anulado') {
            anulados++;
        }
    });

    return {
        resumen: {
            total_tickets: tickets.length,
            vendidos,
            anulados,
            total_cordobas: total_cordobas.toFixed(2)
        },
        tickets: tickets.map(t => ({
            id: t.id,
            numero_ticket: t.numero_ticket,
            estado: t.estado,
            observacion: t.observacion,
            venta_id: t.venta_id,
            created_at: t.created_at,
            total: t.Ventum.total,
            venta_fecha: t.Ventum.created_at,
            detalles: t.Ventum.DetalleVenta.map(d => ({
                producto: d.Producto?.nombre || 'N/A',
                cantidad: d.cantidad,
                precio_unitario: d.precio_unitario,
                total_linea: d.total_linea
            }))
        }))
    };
}

 
//  ESTA FUNCION NO SE USA EN NINGUN LADO, PERO SE DEJA POR SI SE NECESITA EN EL FUTURO
export async function listarTicketsDeHoyPorCajaService(caja_id) {
    // Obtenemos el rango de fechas de hoy en Nicaragua
    const { inicioUTC, finUTC } = getDailyDateRange(NICARAGUA_OFFSET_MINUTES);

    const tickets = await Ticket.findAll({
        include: [
            {
                model: Venta,
                attributes: ['total', 'created_at'],
                where: { 
                    caja_id: caja_id,
                    // ✅ Filtramos para que solo traiga las ventas de HOY
                    created_at: { [Op.between]: [inicioUTC, finUTC] } 
                },
                include: [{
                    model: DetalleVenta,
                    include: [{
                        model: Producto,
                        attributes: ['nombre']
                    }]
                }]
            }
        ],
        order: [['created_at', 'DESC']]
    });

    // Si no hay tickets, retornamos un resumen vacío
    if (tickets.length === 0) {
        return {
            resumen: {
                total_tickets: 0,
                vendidos: 0,
                anulados: 0,
                total_cordobas: "0.00"
            },
            tickets: []
        };
    }
    
    let vendidos = 0, anulados = 0, total_cordobas = 0;
    tickets.forEach(ticket => {
        if (ticket.estado === 'vendido') {
            vendidos++;
            total_cordobas += parseFloat(ticket.Ventum.total);
        } else if (ticket.estado === 'anulado') {
            anulados++;
        }
    });

    return {
        resumen: {
            total_tickets: tickets.length,
            vendidos,
            anulados,
            total_cordobas: total_cordobas.toFixed(2)
        },
        tickets: tickets.map(t => ({
            id: t.id,
            numero_ticket: t.numero_ticket,
            estado: t.estado,
            observacion: t.observacion,
            venta_id: t.venta_id,
            created_at: t.created_at,
            total: t.Ventum.total,
            venta_fecha: t.Ventum.created_at,
            detalles: t.Ventum.DetalleVenta.map(d => ({
                producto: d.Producto?.nombre || 'N/A',
                cantidad: d.cantidad,
                precio_unitario: d.precio_unitario,
                total_linea: d.total_linea
            }))
        }))
    };
}

 
 
// Este servicio permite anular un ticket específico, actualizando su estado y observación
 

export async function anularTicketService(ticket_id, observacion, usuario_id) {
  const ticket = await Ticket.findByPk(ticket_id)

  if (!ticket) {
    throw { status: 404, message: 'Ticket no encontrado.' }
  }

  if (ticket.estado === 'anulado') {
    throw { status: 400, message: 'El ticket ya está anulado.' }
  }

 

  // Actualizar ticket
  ticket.estado = 'anulado'
  ticket.observacion = observacion
  ticket.usuario_id = usuario_id
  await ticket.save()

 //  await Venta.update({ estado: 'cancelada' }, { where: { id: ticket.venta_id } })

  return ticket
}



// Esta función elimina todos los tickets asociados a una caja específica pero no afecta las ventas ni los detalles de venta

export async function eliminarTicketsCajaService(caja_id, usuario_id) {
  const t = await sequelize.transaction()
  try {
    const caja = await Caja.findByPk(caja_id, { transaction: t })
    if (!caja) {
      throw { status: 404, message: 'Caja no encontrada' }
    }

    const ventas = await Venta.findAll({
      where: { caja_id },
      attributes: ['id'],
      transaction: t
    })

    const idsVentas = ventas.map(v => v.id)

    const ticketsEliminados = await Ticket.destroy({
      where: {
        venta_id: idsVentas
      },
      transaction: t
    })

    await t.commit()

    return {
      success: true,
      mensaje: `${ticketsEliminados} tickets eliminados de la caja #${caja_id}. Esta acción no se puede deshacer, pero las ventas y detalles de venta permanecen intactos.`,
      usuario_id
    }
  } catch (error) {
    await t.rollback()
    throw error
  }
}



