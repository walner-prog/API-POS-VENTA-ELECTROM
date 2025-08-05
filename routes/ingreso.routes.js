import express from 'express' 
const router = express.Router();
// usar import en lugar de require 
import { crearIngreso, actualizarIngreso, listarIngresosPorCaja, anularIngreso } from '../controllers/ingreso.controller.js'


import authMiddleware from '../middlewares/auth.js'
import soloCreadorOAdmin from '../middlewares/soloCreadorOAdminEliminaEgreso.js';

router.post('/', authMiddleware, crearIngreso);
router.put('/:id', authMiddleware, actualizarIngreso);
router.get('/caja/:caja_id', authMiddleware, listarIngresosPorCaja);
router.put('/anular/:ingreso_id', authMiddleware, anularIngreso);


export default router
