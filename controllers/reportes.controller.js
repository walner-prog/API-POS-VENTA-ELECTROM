import { obtenerReporteTotales } from '../services/reportes.service.js';

export const getReporteDiario = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const reportes = await obtenerReporteTotales(today, tomorrow);
    res.status(200).json(reportes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReporteSemanal = async (req, res) => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Domingo, 6 = Sábado
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    const reportes = await obtenerReporteTotales(startOfWeek, endOfWeek);
    res.status(200).json(reportes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReporteMensual = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    const reportes = await obtenerReporteTotales(startOfMonth, endOfMonth);
    res.status(200).json(reportes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


 

export const getReporteMesAnterior = async (req, res) => {
  try {
    const today = new Date();
    // Calcular el primer día del mes anterior
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    // Calcular el último día del mes anterior
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const reportes = await obtenerReporteTotales(startOfLastMonth, endOfLastMonth);
    res.status(200).json(reportes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};