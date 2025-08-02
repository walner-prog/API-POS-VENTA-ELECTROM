/**
 * Obtiene el rango de fechas (inicio y fin) para el día actual
 * en una zona horaria específica.
 * @param {number} offsetUTC - El offset de la zona horaria en minutos (ej: -360 para UTC-6).
 * @returns {{inicioUTC: Date, finUTC: Date}} - Un objeto con las fechas de inicio y fin en UTC.
 */
export function getDailyDateRange(offsetUTC) {
    const ahora = new Date();
    
    // Convertimos el offset de minutos a milisegundos
    const offsetMilisegundos = offsetUTC * 60000;
    
    // Obtenemos el inicio del día local de Nicaragua
    const inicioDelDiaLocal = new Date(ahora.getTime() + offsetMilisegundos);
    inicioDelDiaLocal.setUTCHours(0, 0, 0, 0);
    
    // La fecha de inicio del día local de Nicaragua, convertida a UTC
    const inicioUTC = new Date(inicioDelDiaLocal.getTime() - offsetMilisegundos);

    // El fin del día es 24 horas después del inicio, menos 1 milisegundo
    const finUTC = new Date(inicioUTC.getTime() + (24 * 60 * 60 * 1000) - 1);

    return { inicioUTC, finUTC };
}

// Puedes exportar un valor para Nicaragua directamente para facilitar su uso
export const NICARAGUA_OFFSET_MINUTES = -6 * 60; // UTC-6