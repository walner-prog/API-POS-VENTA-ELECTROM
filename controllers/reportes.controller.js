import { obtenerReporteTotales,obtenerReporteTotalesDetallado } from '../services/reportes.service.js';
import { 
    getDailyDateRange, 
    getWeeklyDateRange, 
    getMonthlyDateRange, 
    NICARAGUA_OFFSET_MINUTES 
}  from "../utils/dateUtils.js";
import { reportesService } from '../services/venta/totalesVentasReporte.service.js';


import { subMonths, startOfYear, startOfMonth, endOfMonth } from "date-fns";

// --- REPORTE DIARIO ---
export const getReporteDiario = async (req, res) => {
    try {
        // Usamos la función de utilidad para obtener el rango de "hoy" en Nicaragua
        const { inicioUTC, finUTC } = getDailyDateRange(NICARAGUA_OFFSET_MINUTES);
        const reportes = await obtenerReporteTotales(inicioUTC, finUTC);
        res.status(200).json(reportes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- REPORTE SEMANAL ---
export const getReporteSemanal = async (req, res) => {
    try {
        // Usamos la función de utilidad para obtener el rango de "esta semana" en Nicaragua
        const { inicioUTC, finUTC } = getWeeklyDateRange(NICARAGUA_OFFSET_MINUTES);
        const reportes = await obtenerReporteTotales(inicioUTC, finUTC);
        res.status(200).json(reportes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- REPORTE MENSUAL ---
export const getReporteMensual = async (req, res) => {
    try {
        // Usamos la función de utilidad para obtener el rango de "este mes" en Nicaragua
        const { inicioUTC, finUTC } = getMonthlyDateRange(NICARAGUA_OFFSET_MINUTES);
        const reportes = await obtenerReporteTotales(inicioUTC, finUTC);
        res.status(200).json(reportes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- REPORTE MES ANTERIOR ---
export const getReporteMesAnterior = async (req, res) => {
    try {
        // La lógica del mes anterior es un poco diferente
        const { inicioUTC, finUTC } = getMonthlyDateRange(NICARAGUA_OFFSET_MINUTES);
        
        // Ajustamos las fechas para que sean del mes anterior
        const inicioMesAnterior = new Date(inicioUTC);
        inicioMesAnterior.setUTCMonth(inicioMesAnterior.getUTCMonth() - 1);
        
        const finMesAnterior = new Date(finUTC);
        finMesAnterior.setUTCMonth(finMesAnterior.getUTCMonth() - 1);
        
        const reportes = await obtenerReporteTotales(inicioMesAnterior, finMesAnterior);
        res.status(200).json(reportes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- REPORTE PERSONALIZADO ---

export const obtenerReporteController = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        message: 'Debe proporcionar fechaInicio y fechaFin en formato YYYY-MM-DD'
      });
    }

    // Convertir las fechas a objetos Date
    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = new Date(fechaFin);

    // Ajustar la fechaFin para incluir todo el día
    fechaFinDate.setHours(23, 59, 59, 999);

    

    const reporte = await obtenerReporteTotalesDetallado(fechaInicioDate, fechaFinDate);

    return res.json({
      success: true,
      data: reporte
    });

  } catch (error) {
    console.error('Error en el controlador de reporte:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el reporte de ventas',
      error: error.message
    });
  }
};

// --- REPORTE ANUAL ---

export const obtenerReportesVentas = async (req, res) => {
  try {
    const hoy = new Date();
    const inicioSemana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 7);
    const inicioMes = startOfMonth(hoy);
    const inicio6Meses = subMonths(hoy, 6);
    const inicioAnio = startOfYear(hoy);

    const [semanal, mensual, seisMeses, anual, totales] = await Promise.all([
      reportesService.semanal(inicioSemana, hoy),
      reportesService.mensual(inicioMes, endOfMonth(hoy)),
      reportesService.seisMeses(inicio6Meses, hoy),
      reportesService.anual(inicioAnio, hoy),
      reportesService.totales(),
    ]);

    res.json({
      success: true,
      data: { semanal, mensual, seisMeses, anual, totales },
    });
  } catch (error) {
    console.error("Error al obtener reportes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener reportes de ventas.",
    });
  }
};
