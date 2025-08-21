import  { registrarCompraService, listarComprasService, obtenerCompraPorIdService } from '../services/compra.service.js';

 
export async function registrarCompra(req, res) {
  try {
     
    const compra = await registrarCompraService(req.body, req.usuario);
    res.status(201).json(compra);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
}


export async function listarCompras(req, res) {
  try {
    const { total, pagina, limite, total_paginas, data } = await listarComprasService(req.query);

    res.json({
      success: true,
      total,
      pagina,
      limite,
      total_paginas,
      data
    });
  } catch (error) {
    console.error("Error en listarCompras:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Error al listar las compras"
    });
  }
}

export async function obtenerCompraPorId(req, res) {
  try {
    const compra = await obtenerCompraPorIdService(req.params.id);
    res.json(compra);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
}
