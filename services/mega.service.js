// backend/services/mega.service.js
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Mega = require('megajs'); // ahora funciona con ESM

import fs from 'fs';
import path from 'path';

// Credenciales Mega
const email = "carlosmega085@gmail.com";
const password = "12345678mega";

/**
 * Sube un archivo local a Mega y devuelve la URL de descarga
 * @param {string} filePath - Ruta del archivo local
 * @returns {Promise<string>} - URL de descarga
 */
export async function uploadToMega(filePath) {
  try {
    const storage = new Mega({ email, password });
    await storage.ready;
    console.log("Sesión en Mega iniciada correctamente.");

    const fileName = path.basename(filePath);
    const stats = fs.statSync(filePath);
    const fileStream = fs.createReadStream(filePath);

    const file = await storage
      .upload(
        {
          name: fileName,
          size: stats.size,
          allowUploadBuffering: true,
        },
        fileStream
      )
      .complete;

    const downloadUrl = await file.link();
    console.log("Archivo subido a Mega. URL:", downloadUrl);

    return downloadUrl;
  } catch (error) {
    console.error("Error al subir archivo a Mega:", error);
    throw new Error("No se pudo subir la imagen de la factura a Mega.");
  }
}
