import sequelize from '../../config/database.js'
import { Venta, Caja, Ticket } from '../../models/index.js'
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

    if (!cajaAbierta) throw { status: 400, message: 'Debe abrir una caja primero.' };

    // Validar stock
    await validarStock(carrito, t);
    console.log(`✔ Validación stock en ${Date.now() - start} ms`);

    // Calcular precios con descuento por producto
    let subtotal = 0;
    for (const item of carrito) {
      const producto = await Producto.findByPk(item.producto_id, { transaction: t });
      const precioConDescuento = producto.precio_venta * (1 - (producto.descuento || 0) / 100);
      item.precio_unitario = parseFloat(precioConDescuento.toFixed(2));
      item.total_linea = parseFloat((item.precio_unitario * item.cantidad).toFixed(2));
      subtotal += item.total_linea;
    }

    const iva = parseFloat((subtotal * 0.15).toFixed(2)); // ejemplo 15%
    const total = subtotal + iva;

    // Crear venta
    const venta = await Venta.create({
      cliente_nombre,
      subtotal,
      descuento: 0, // ya no se usa descuento global
      iva,
      total,
      observacion,
      caja_id: cajaAbierta.id,
      usuario_id
    }, { transaction: t });

    console.log(`✔ Creación venta en ${Date.now() - start} ms`);

    // Descontar stock y registrar detalle
    await descontarStock(carrito, venta.id, t);
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

