/**
 * Obtiene el rango de fechas (inicio y fin) para el día actual
 * en una zona horaria específica.
 * @param {number} offsetUTC - El offset de la zona horaria en minutos (ej: -360 para UTC-6).
 * @returns {{inicioUTC: Date, finUTC: Date}} - Un objeto con las fechas de inicio y fin en UTC.
 */
export function getDailyDateRange(offsetUTC) {
    const ahora = new Date();
    
    // Convertir la hora actual a la zona horaria local deseada
    const fechaLocal = new Date(ahora.getTime() + (ahora.getTimezoneOffset() * 60000) + (offsetUTC * 60000));
    
    // Crear el inicio y el fin del día en la zona horaria local
    const inicioDelDiaLocal = new Date(fechaLocal);
    inicioDelDiaLocal.setHours(0, 0, 0, 0);

    const finDelDiaLocal = new Date(fechaLocal);
    finDelDiaLocal.setHours(23, 59, 59, 999);
    
    // Convertir de nuevo a UTC para la consulta a la base de datos
    const inicioUTC = new Date(inicioDelDiaLocal.getTime() - (inicioDelDiaLocal.getTimezoneOffset() * 60000));
    const finUTC = new Date(finDelDiaLocal.getTime() - (finDelDiaLocal.getTimezoneOffset() * 60000));

    return { inicioUTC, finUTC };
}

// Puedes exportar un valor para Nicaragua directamente para facilitar su uso
export const NICARAGUA_OFFSET_MINUTES = -6 * 60; // UTC-6