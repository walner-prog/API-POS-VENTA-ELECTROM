import  { registrarCompraService, listarComprasService, obtenerCompraPorIdService, eliminarCompraService } from '../services/compra.service.js';

 
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

// Controlador para obtener una compra específica por ID
export async function obtenerCompraPorId(req, res) {
  const { id } = req.params; // obtenemos el id desde los parámetros de la URL

  if (!id) {
    return res.status(400).json({ message: "El ID de la compra es obligatorio" });
  }

  try {
    const compra = await obtenerCompraPorIdService(id);

    if (!compra) {
      return res.status(404).json({ message: "Compra no encontrada" });
    }

    res.json(compra);
  } catch (error) {
    console.error("Error al obtener la compra:", error);
    res.status(error.status || 500).json({ message: error.message || "Error interno del servidor" });
  }
}

export async function eliminarCompra(req, res) {
  const { id } = req.params;
  const usuario = req.user; // ⚠️ Asumiendo que ya tienes middleware de auth

  if (!id) {
    return res
      .status(400)
      .json({ message: "El ID de la compra es obligatorio" });
  }

  try {
    const resultado = await eliminarCompraService(id, usuario);
    res.status(200).json(resultado); // 👈 devolvemos info útil, no vacío
  } catch (error) {
    console.error("Error al eliminar la compra:", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Error interno del servidor" });
  }
}

