// controllers/kpis.controller.js
import kpisService from "../services/kpis.service.js";

export const getKpis = async (req, res) => {
  try {
    const data = await kpisService.getKpis();
    res.json({ success: true, data });
  } catch (error) {
    console.error("❌ Error obteniendo KPIs:", error);
    res.status(500).json({ success: false, message: "Error al obtener KPIs" });
  }
};
