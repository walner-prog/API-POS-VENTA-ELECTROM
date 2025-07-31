import { Router } from 'express';
import { getReporteDiario, getReporteSemanal, getReporteMensual } from '../controllers/reportes.controller.js';

const router = Router();

router.get('/diario', getReporteDiario);
router.get('/semanal', getReporteSemanal);
router.get('/mensual', getReporteMensual);

export default router;