import {
  crearIngresoService,
  actualizarIngresoService,
  listarIngresosPorCajaService,
  anularIngresoService
} from '../services/ingreso.service.js';

export async function crearIngreso(req, res) {
  const { body, usuario } = req;
  const ingreso = await crearIngresoService(body, usuario);
  res.json(ingreso);
}

export async function actualizarIngreso(req, res) {
  const ingreso = await actualizarIngresoService(req.params.id, req.body);
  res.json(ingreso);
}

export async function listarIngresosPorCaja(req, res) {
  const ingresos = await listarIngresosPorCajaService(req.params.caja_id, req.query);
  res.json(ingresos);
}

export async function anularIngreso(req, res) {
  const ingreso = await anularIngresoService(req.params.ingreso_id, req.usuario.id);
  res.json(ingreso);
}
