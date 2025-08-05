import {
  listarClavesCancelacionService,
  crearClaveCancelacionService,
  activarClaveCancelacionService,
  eliminarClaveCancelacionService,
  validarClaveCancelacionService
} from '../services/clavesCancelacion.service.js';

export const listarClaves = async (req, res) => {
  try {
    const claves = await listarClavesCancelacionService();
    res.json(claves);
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al listar claves' });
  }
};

export const crearClave = async (req, res) => {
  try {
    const { clave, expira_en } = req.body;
    const nueva = await crearClaveCancelacionService(clave, expira_en);
    res.json({ ok: true, mensaje: "Clave creada", clave_id: nueva.id });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, mensaje: error.message || 'Error al crear clave' });
  }
};

export const activarClave = async (req, res) => {
  try {
    const { id } = req.params;
    await activarClaveCancelacionService(id);
    res.json({ ok: true, mensaje: "Clave activada" });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, mensaje: error.message || 'Error al activar clave' });
  }
};

export const eliminarClave = async (req, res) => {
  try {
    const { id } = req.params;
    await eliminarClaveCancelacionService(id);
    res.json({ ok: true, mensaje: "Clave eliminada" });
  } catch (error) {
    res.status(error.status || 500).json({ ok: false, mensaje: error.message || 'Error al eliminar clave' });
  }
};

export const validarClave = async (req, res) => {
  try {
    const { clave } = req.body;
    const result = await validarClaveCancelacionService(clave);
    res.json(result); // { ok: true, mensaje: ... }
  } catch (error) {
    res.status(error.status || 400).json({ ok: false, mensaje: error.message });
  }
};
