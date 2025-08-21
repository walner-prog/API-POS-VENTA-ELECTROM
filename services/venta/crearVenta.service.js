import sequelize from '../../config/database.js'
import { Venta, Caja, Ticket,Producto } from '../../models/index.js'
import { validarStock } from './utils/validarStock.js'
import { descontarStock } from './utils/descontarStock.js'

 

export async function crearVentaService({ carrito, cliente_nombre, observacion }, usuario_id) {
    const t = await sequelize.transaction();
    const start = Date.now();

    try {
        // Verificar caja abierta
        const cajaAbierta = await Caja.findOne({
            where: { usuario_id, estado: 'abierta' },
            order: [['created_at', 'DESC']],
            transaction: t
        });

        if (!cajaAbierta) {
            throw { status: 400, message: 'Debe abrir una caja primero.' };
        }

        // Validar stock
        await validarStock(carrito, t);
        console.log(`✔ Validación stock en ${Date.now() - start} ms`);

        let subtotalSinDescuento = 0;
        let totalDescuento = 0;
        let totalIva = 0;

        // Recorrer el carrito para calcular los totales y registrar los detalles
        const detallesVenta = [];
        for (const item of carrito) {
            const producto = await Producto.findByPk(item.producto_id, { transaction: t });
            
            // Si el producto no existe, abortamos la transacción
            if (!producto) {
                throw new Error(`Producto con ID ${item.producto_id} no encontrado.`);
            }

            // Calcular el precio de la línea
            const precioBase = parseFloat(producto.precio_venta) || 0;
            const descuentoPorc = parseFloat(producto.descuento) || 0;
            const ivaPorc = parseFloat(producto.iva) || 0;

            const precioConDescuento = precioBase * (1 - descuentoPorc / 100);
            const totalLineaSinIva = precioConDescuento * item.cantidad;
            const ivaLinea = totalLineaSinIva * (ivaPorc / 100);

            // Acumular los totales de la venta
            subtotalSinDescuento += precioBase * item.cantidad;
            totalDescuento += (precioBase * descuentoPorc / 100) * item.cantidad;
            totalIva += ivaLinea;

            detallesVenta.push({
                producto_id: producto.id,
                cantidad: item.cantidad,
                precio_unitario: precioConDescuento, // Precio unitario con descuento
                total_linea: totalLineaSinIva + ivaLinea, // Total de la línea con IVA
                descuento: descuentoPorc,
                iva: ivaPorc
            });
        }

        const totalVenta = subtotalSinDescuento - totalDescuento + totalIva;

        // Crear la venta
        const venta = await Venta.create({
            cliente_nombre,
            subtotal: subtotalSinDescuento,
            descuento: totalDescuento,
            iva: totalIva,
            total: totalVenta,
            observacion,
            caja_id: cajaAbierta.id,
            usuario_id
        }, { transaction: t });

        console.log(`✔ Creación venta en ${Date.now() - start} ms`);

        // Descontar stock y registrar detalle
        await descontarStock(detallesVenta, venta.id, t);
        console.log(`✔ Descuento stock y detalle en ${Date.now() - start} ms`);

        // Crear ticket
        const numero_ticket = `TICKET-${venta.id}-${Date.now()}`;
        await Ticket.create({
            numero_ticket,
            venta_id: venta.id,
            usuario_id,
            estado: 'vendido',
            observacion: `Venta vinculada #${venta.id}`
        }, { transaction: t });

        await t.commit();
        console.log(`✔ Ticket creado en ${Date.now() - start} ms`);

        return {
            success: true,
            message: `Venta completada. Ticket: ${numero_ticket}`,
            venta_id: venta.id
        };
    } catch (error) {
        await t.rollback();
        throw error;
    }
}

 