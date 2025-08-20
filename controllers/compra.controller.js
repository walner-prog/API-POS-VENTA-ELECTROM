import * as compraService from '../services/compra.service.js';

export async function registrarCompra(req, res) {
  try {
    const compra = await compraService.registrarCompraService(req.body, req.user);
    res.status(201).json(compra);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
}

export async function listarCompras(req, res) {
  try {
    const compras = await compraService.listarComprasService(req.query);
    res.json(compras);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
}

export async function obtenerCompraPorId(req, res) {
  try {
    const compra = await compraService.obtenerCompraPorIdService(req.params.id);
    res.json(compra);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
}
