/**
 * Obtiene el rango de fechas (inicio y fin) para el día actual
 * en una zona horaria específica.
 * @param {number} offsetUTC - El offset de la zona horaria en minutos (ej: -360 para UTC-6).
 * @returns {{inicioUTC: Date, finUTC: Date}} - Un objeto con las fechas de inicio y fin en UTC.
 */
export function getDailyDateRange(offsetUTC) {
    // 1. Obtenemos la hora actual del servidor.
    const ahora = new Date();
    
    // 2. Calculamos el inicio del día en la zona horaria local (Nicaragua).
    // Para ello, ajustamos la hora actual del servidor por el offset de Nicaragua.
    const inicioLocal = new Date(ahora.getTime() + (ahora.getTimezoneOffset() * 60000) + (offsetUTC * 60000));
    inicioLocal.setHours(0, 0, 0, 0); // Establecemos las 00:00 del día local.
    
    // 3. Convertimos ese inicio local de vuelta a UTC para la consulta.
    const inicioUTC = new Date(inicioLocal.getTime() - (inicioLocal.getTimezoneOffset() * 60000));

    // 4. Calculamos el fin del día en UTC (24 horas después del inicio, menos 1ms).
    const finUTC = new Date(inicioUTC.getTime() + (24 * 60 * 60 * 1000) - 1);

    return { inicioUTC, finUTC };
}

// Puedes exportar un valor para Nicaragua directamente para facilitar su uso
export const NICARAGUA_OFFSET_MINUTES = -6 * 60; // UTC-6