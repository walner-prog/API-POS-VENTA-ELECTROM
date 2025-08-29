import sequelize from "../config/database.js";
import { Op } from 'sequelize'
import { Caja, Venta, Egreso, DetalleVenta, Producto,Usuario,Ingreso } from '../models/index.js'
import { getCurrentTimeInTimezone, NICARAGUA_OFFSET_MINUTES }  from "../utils/dateUtils.js";

 

export async function abrirCajaService({ monto_inicial, observacion, nombre }, usuario_id_cajero) {
    const t = await sequelize.transaction();
    try {
        if (monto_inicial <= 0) {
            throw { status: 400, message: 'El monto inicial debe ser mayor a 0.' };
        }
        if (monto_inicial == null) {
            throw { status: 400, message: 'Debe indicar un monto inicial para abrir la caja.' };
        }
        monto_inicial = Number(monto_inicial);
        if (isNaN(monto_inicial)) {
            throw { status: 400, message: "El monto inicial es obligatorio y debe ser un número válido" };
        }

        const cajeroUser = await Usuario.findByPk(usuario_id_cajero, { transaction: t });
        if (!cajeroUser) {
            throw {
                status: 404,
                message: 'No se encontró el usuario especificado. Verifique el usuario antes de abrir la caja.'
            };
        }

        const cajaAbierta = await Caja.findOne({
            where: { usuario_id: usuario_id_cajero, estado: 'abierta' },
            transaction: t
        });

        if (cajaAbierta) {
            throw {
                status: 400,
                message: `El usuario ${cajeroUser.nombre} ya tiene una caja abierta. Cierre la caja actual antes de abrir una nueva.`
            };
        }

        // --- APLICACIÓN DE LA ZONA HORARIA ---
        const nowNicaragua = getCurrentTimeInTimezone(NICARAGUA_OFFSET_MINUTES);
        const hora_apertura_string = nowNicaragua.toTimeString().split(' ')[0]; // Para almacenar como string de hora local

        const caja = await Caja.create({
            nombre,
            monto_inicial,
            observacion,
            usuario_id: usuario_id_cajero,
            abierto_por: usuario_id_cajero,
            hora_apertura: hora_apertura_string // Almacena la hora local de Nicaragua como string
        }, { transaction: t });

        await t.commit();

        // Formatea la fecha para el mensaje de respuesta usando la hora de Nicaragua
        const fechaFormateada = nowNicaragua.toLocaleString('es-NI', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
            hour12: true
        });

        return {
            success: true,
            message: `La caja "${caja.nombre}" se abrió correctamente para el usuario ${cajeroUser.nombre} con un monto inicial de ${parseFloat(caja.monto_inicial).toFixed(2)}. Hora de apertura: ${fechaFormateada}.`,
            caja: {
                id: caja.id,
                nombre: caja.nombre,
                monto_inicial: parseFloat(caja.monto_inicial).toFixed(2),
                hora_apertura: fechaFormateada // Retorna la hora formateada de Nicaragua
            }
        };
    } catch (error) {
        await t.rollback();
        throw error;
    }
}


 

 
// Define el offset de Nicaragua (UTC-6)
const NICARAGUA_OFFSET_MINUTES = -360; 

export async function cerrarCajaService(caja_id, usuario_id) {
    const t = await sequelize.transaction();

    try {
        const caja = await Caja.findOne({ 
            where: { id: caja_id, usuario_id, estado: 'abierta' }, 
            include: [{ model: Usuario, attributes: ['nombre'] }],
            transaction: t 
        });
        if (!caja) throw { status: 404, message: 'Caja no encontrada o ya cerrada' };

        const ventas = await Venta.findAll({ where: { caja_id: caja.id, estado: 'completada' }, transaction: t });
        const totalVentas = ventas.reduce((acc, venta) => acc + parseFloat(venta.total), 0);
        const totalEgresos = await Egreso.sum('monto', { where: { caja_id: caja.id, estado: 'activo' }, transaction: t }) || 0;
        const totalIngresos = await Ingreso.sum('monto', { where: { caja_id: caja.id, estado: 'activo' }, transaction: t }) || 0;
        
        const detalles = await DetalleVenta.findAll({
            include: [{ model: Producto, attributes: ['precio_compra'] }, { model: Venta, where: { caja_id: caja.id, estado: 'completada' }, attributes: [] }],
            transaction: t
        });
        const total_precio_compra = detalles.reduce((acc, d) => acc + parseFloat(d.cantidad) * parseFloat(d.Producto.precio_compra), 0);
        const total_precio_venta = detalles.reduce((acc, d) => acc + parseFloat(d.total_linea), 0);
        const ganancia = total_precio_venta - total_precio_compra;
        const dineroFinal = parseFloat(caja.monto_inicial) + totalVentas + totalIngresos - totalEgresos;

        // ✅ CORRECCIÓN CLAVE
        // 1. Obtén la fecha UTC del servidor
        const utcDate = new Date(); 
        
        caja.monto_final = dineroFinal;
        caja.estado = 'cerrada';
        caja.closed_at = utcDate; // Guarda el objeto Date UTC en la base de datos

        await caja.save({ transaction: t });
        await t.commit();

        // 2. Para la respuesta, usa tu función para obtener la fecha local de Nicaragua
        const fechaNicaragua = getCurrentTimeInTimezone(NICARAGUA_OFFSET_MINUTES);

        // 3. Y formatea esa fecha local para el front-end
        const fechaFormateada = fechaNicaragua.toLocaleString('es-NI', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: true
        });

        return {
            success: true,
            message: 'Caja cerrada correctamente.',
            cierre: {
                id: caja.id,
                usuario_nombre: caja.Usuario.nombre,
                monto_inicial: caja.monto_inicial,
                total_ventas: totalVentas,
                total_egresos: totalEgresos,
                total_ingresos: totalIngresos,
                total_precio_compra,
                total_precio_venta,
                ganancia,
                cantidad_tickets: ventas.length,
                dinero_final: dineroFinal,
                hora_apertura: caja.hora_apertura,
                hora_cierre: fechaFormateada, // Envía la cadena formateada de Nicaragua al front-end
                usuario_id
            }
        };
    } catch (error) {
        await t.rollback();
        throw error;
    }
}


export async function listarCierresService(usuario_id, desde, hasta, pagina = 1, limite = 5, estadoCaja) {
    const offset = (pagina - 1) * limite;

    const hace31Dias = new Date();
    hace31Dias.setDate(hace31Dias.getDate() - 31);

    const where = {
        usuario_id,
        estado: 'cerrada',
        closed_at: {
            [Op.gte]: hace31Dias
        }
    };

    if (desde) {
        where.closed_at[Op.gte] = new Date(desde);
    }
    if (hasta) {
        where.closed_at[Op.lte] = new Date(hasta);
    }
    if (estadoCaja) {
        where.estado = estadoCaja;
    }

    const { count, rows } = await Caja.findAndCountAll({
        where,
        order: [['closed_at', 'DESC']],
        limit: parseInt(limite),
        offset: parseInt(offset),
        distinct: true,
        subQuery: false, // <-- ¡Importante!
        include: [
            {
                model: Usuario,
                attributes: ['id', 'nombre']
            },
            {
                model: Venta,
                required: false,
                attributes: ['id', 'total', 'estado']
            },
            {
                model: Egreso,
                required: false,
                attributes: ['id', 'monto', 'estado']
            },
            {
                model: Ingreso,
                required: false,
                attributes: ['id', 'monto', 'estado']
            }
        ]
    });

    // Usa map y reduce para calcular los totales, ahora que los datos están disponibles
    const historial = rows.map(caja => {
        const totalVentas = caja.Ventas?.filter(v => v.estado === 'completada')
                                .reduce((acc, v) => acc + parseFloat(v.total), 0) || 0;
        const totalEgresos = caja.Egresos?.filter(e => e.estado === 'activo')
                                .reduce((acc, e) => acc + parseFloat(e.monto), 0) || 0;
        const totalIngresos = caja.Ingresos?.filter(i => i.estado === 'activo')
                                .reduce((acc, i) => acc + parseFloat(i.monto), 0) || 0;
        const dineroEsperado = parseFloat(caja.monto_inicial) + totalVentas + totalIngresos - totalEgresos;

        // Ya no necesitas la subconsulta de DetalleVenta aquí, es muy ineficiente
        // Si necesitas la ganancia, deberías calcularla en el cierre de caja y guardarla
        const total_precio_compra = 0; // o calcula esto en el momento del cierre
        const total_precio_venta = totalVentas; // O la suma de los 'total_linea'
        const ganancia = total_precio_venta - total_precio_compra;

        return {
            id: caja.id,
            monto_inicial: caja.monto_inicial,
            monto_final: caja.monto_final,
            hora_apertura: caja.hora_apertura,
            created_at: caja.created_at,
            closed_at: caja.closed_at,
            estado: caja.estado,
            observacion: caja.observacion,
            total_ventas: totalVentas,
            total_egresos: totalEgresos,
            total_ingresos: totalIngresos,
            dinero_esperado: dineroEsperado,
            total_precio_compra,
            total_precio_venta,
            ganancia,
            usuario: caja.Usuario
        };
    });

    return {
        success: true,
        historial,
        total: count,
        pagina: parseInt(pagina),
        paginas: Math.ceil(count / limite),
        message: historial.length === 0 ? 'No hay cierres registrados en los últimos 31 días' : undefined,
    };
}


 

export async function historialCierresService(
    usuario_id,
    desde,
    hasta,
    pagina = 1,
    limite = 5,
    estadoCaja // opcional, si quieres filtrar por cerrado/abierto
) {
    const offset = (pagina - 1) * limite;

    // --- ZONA HORARIA ---
    const hoyNicaragua = getCurrentTimeInTimezone(NICARAGUA_OFFSET_MINUTES);
    const hace31DiasNicaragua = new Date(hoyNicaragua);
    hace31DiasNicaragua.setDate(hace31DiasNicaragua.getDate() - 31);
    hace31DiasNicaragua.setHours(0, 0, 0, 0);

    // --- VALIDACIÓN DE FECHAS ---
    if (desde) {
        const fechaDesde = new Date(desde);
        if (fechaDesde < hace31DiasNicaragua)
            throw { status: 400, message: 'La fecha de inicio no puede ser anterior a los últimos 31 días.' };
        if (fechaDesde > hoyNicaragua)
            throw { status: 400, message: 'La fecha de inicio no puede ser una fecha futura.' };
    }

    if (desde && hasta) {
        const fechaDesde = new Date(desde);
        const fechaHasta = new Date(hasta);
        if (fechaDesde > fechaHasta)
            throw { status: 400, message: "La fecha 'Desde' no puede ser mayor que la fecha 'Hasta'." };
    }

    // --- FILTROS ---
    const where = { usuario_id };
    if (estadoCaja) where.estado = estadoCaja;

    const fechaFiltro = {};
    if (desde) fechaFiltro[Op.gte] = new Date(new Date(desde).getTime() - NICARAGUA_OFFSET_MINUTES * 60000);
    if (hasta) fechaFiltro[Op.lte] = new Date(new Date(hasta).getTime() - NICARAGUA_OFFSET_MINUTES * 60000);
    where.closed_at = Object.keys(fechaFiltro).length ? fechaFiltro : { [Op.gte]: hace31DiasNicaragua };

    // --- CONSULTA OPTIMIZADA ---
    const { count, rows: cajas } = await Caja.findAndCountAll({
        where,
        order: [['closed_at', 'DESC']],
        attributes: ['id', 'monto_inicial', 'monto_final', 'closed_at', 'observacion', 'estado', 'hora_apertura'],
        include: [
            { model: Usuario, attributes: ['id', 'nombre'] },
            {
                model: Venta,
                required: false,
                attributes: ['id', 'total', 'estado'],
                // Filtra las ventas, pero no hace que la caja se pierda si no tiene ventas completadas
                where: { estado: 'completada' } 
            },
            {
                model: Egreso,
                required: false,
                attributes: ['id', 'monto', 'estado'],
                where: { estado: 'activo' } 
            },
            {
                model: Ingreso,
                required: false,
                attributes: ['id', 'monto', 'estado'],
                where: { estado: 'activo' } 
            },
        ],
        limit: parseInt(limite),
        offset: parseInt(offset),
        distinct: true,
        subQuery: false
    });

    
 

 
    const historial = cajas.map(caja => {
        // La suma ahora es directa porque el filtro ya se aplicó en la consulta
        const totalVentas = caja.Ventas?.reduce((acc, v) => acc + parseFloat(v.total), 0) || 0;
        const totalEgresos = caja.Egresos?.reduce((acc, e) => acc + parseFloat(e.monto), 0) || 0;
        const totalIngresos = caja.Ingresos?.reduce((acc, i) => acc + parseFloat(i.monto), 0) || 0;

        const dineroEsperado = parseFloat(caja.monto_inicial) + totalVentas + totalIngresos - totalEgresos;

        return {
            id: caja.id,
            monto_inicial: caja.monto_inicial,
            monto_final: caja.monto_final,
            hora_apertura: caja.hora_apertura,
            created_at: caja.created_at,
            closed_at: caja.closed_at,
            estado: caja.estado,
            observacion: caja.observacion,
            total_ventas: totalVentas,
            total_egresos: totalEgresos,
            total_ingresos: totalIngresos,
            dinero_esperado: dineroEsperado,
            usuario: caja.Usuario,
        };
    });

   
 
    return {
        success: true,
        historial,
        total: count,
        pagina: parseInt(pagina),
        paginas: Math.ceil(count / limite),
        message: historial.length === 0 ? 'No hay cierres registrados en los últimos 31 días' : undefined,
    };


}

export async function verCajaAbiertaService(usuario_id) {
  const caja = await Caja.findOne({
    where: { usuario_id, estado: 'abierta' },
    include: [
      {
        model: Venta,
        where: { estado: 'completada' },
        required: false,
        attributes: ['id', 'total', 'estado']
      },
      {
        model: Egreso,
        where: { estado: 'activo' },
        required: false,
        attributes: ['id', 'monto', 'estado']
      },
      {
        model: Ingreso,
        where: { estado: 'activo' },
        required: false,
        attributes: ['id', 'monto', 'estado']
      },
      {
        model: Usuario, // ✅ aquí se agrega
        attributes: ['id', 'nombre'] // puedes incluir más si querés mostrarlo
      }
    ]
  });

  if (!caja) throw { status: 404, message: 'No hay caja abierta para este usuario.' };

  const totalVentas = caja.Venta?.reduce((acc, v) => acc + parseFloat(v.total), 0) || 0;
  const totalEgresos = caja.Egresos?.reduce((acc, e) => acc + parseFloat(e.monto), 0) || 0;
  const totalIngresos = caja.Ingresos?.reduce((acc, i) => acc + parseFloat(i.monto), 0) || 0; 
  const dineroEsperado = parseFloat(caja.monto_inicial) + totalVentas + totalIngresos - totalEgresos;

  return {
    success: true,
    caja: {
      id: caja.id,
      estado: caja.estado,
      monto_inicial: caja.monto_inicial,
      total_ventas: totalVentas,
      total_egresos: totalEgresos,
      total_ingresos: totalIngresos, 
      dinero_esperado: dineroEsperado,
      hora_apertura: caja.created_at,
      usuario: caja.Usuario // ✅ devolver el usuario también
    }
  };
}


 

export async function cajaActualService(usuario_id) {
  const caja = await Caja.findOne({
    where: { usuario_id, estado: 'abierta' },
    include: [
      {
        model: Venta,
        where: { estado: 'completada' },
        required: false,
        attributes: ['id', 'total', 'estado']
      },
      {
        model: Egreso,
        where: { estado: 'activo' },
        required: false,
        attributes: ['id', 'monto', 'estado']
      }
      
    ]
    
  });
 
  if (!caja) throw { status: 404, message: 'No hay caja abierta para este usuario.' };

  // Aquí usamos la propiedad que te devuelve Sequelize, que es singular
  const totalVentas = caja.Venta?.reduce((acc, v) => acc + parseFloat(v.total), 0) || 0;
  const totalEgresos = caja.Egresos?.reduce((acc, e) => acc + parseFloat(e.monto), 0) || 0;
  const dineroEsperado = parseFloat(caja.monto_inicial) + totalVentas - totalEgresos;

  return {
    success: true,
    caja: {
      id: caja.id,
      monto_inicial: caja.monto_inicial,
      total_ventas: totalVentas,
      total_egresos: totalEgresos,
      dinero_esperado: dineroEsperado,
      hora_apertura: caja.created_at
    }
  };
}

export const listarCajasParaSelectorService = async () => {
  // Usamos la función de utilidad para obtener la fecha de hoy en Nicaragua
  const nowNicaragua = getCurrentTimeInTimezone(NICARAGUA_OFFSET_MINUTES);

  // Calculamos la fecha límite (hace 31 días) en la zona horaria de Nicaragua
  const fechaLimite = new Date(nowNicaragua);
  fechaLimite.setDate(fechaLimite.getDate() - 31);
  // El resto de la fecha/hora es la misma, solo se ajusta el día

  // Todas las cajas abiertas
  const cajasAbiertas = await Caja.findAll({
    where: {
      estado: 'abierta'
    },
    include: [
      {
        model: Usuario,
        attributes: ['id', 'nombre']
      }
    ],
    attributes: ['id', 'created_at'],
    order: [['created_at', 'DESC']]
  });

  // Cajas cerradas en los últimos 31 días, basado en la zona horaria de Nicaragua
  const cajasCerradas = await Caja.findAll({
    where: {
      estado: 'cerrada',
      created_at: { [Op.gte]: fechaLimite }
    },
    include: [
      {
        model: Usuario,
        attributes: ['id', 'nombre']
      }
    ],
    attributes: ['id', 'created_at', 'closed_at'],
    order: [['created_at', 'DESC']]
  });

  // Mapear cajas abiertas
  const cajasAbiertasMapeadas = cajasAbiertas.map(caja => ({
    id: caja.id,
    fecha_apertura: caja.created_at,
    cajero: caja.Usuario?.nombre || 'Desconocido'
  }));

  // Mapear cajas cerradas
  const cajasCerradasMapeadas = cajasCerradas.map(caja => ({
    id: caja.id,
    fecha_apertura: caja.created_at,
    fecha_cierre: caja.closed_at,
    cajero: caja.Usuario?.nombre || 'Desconocido'
  }));

  return {
    cajasAbiertas: cajasAbiertasMapeadas,
    cajasCerradas: cajasCerradasMapeadas
  };
};



