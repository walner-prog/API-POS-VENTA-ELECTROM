import { Router } from 'express';
import { getReporteDiario, getReporteSemanal, getReporteMensual, getReporteMesAnterior } from '../controllers/reportes.controller.js';

const router = Router();

router.get('/diario', getReporteDiario);
router.get('/semanal', getReporteSemanal);
router.get('/mensual', getReporteMensual);
router.get('/mes-anterior', getReporteMesAnterior); // Assuming this is the same as getReporteMensual, adjust if needed

export default router;