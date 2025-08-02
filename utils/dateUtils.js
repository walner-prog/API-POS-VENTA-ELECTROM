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

/**
 * Obtiene el rango de fechas para la semana actual en una zona horaria específica.
 */
export function getWeeklyDateRange(offsetUTC) {
    const ahora = new Date();
    const offsetMilisegundos = offsetUTC * 60000;
    const inicioLocal = new Date(ahora.getTime() + offsetMilisegundos);
    
    // Obtener el inicio de la semana (Lunes)
    const diaDeLaSemana = inicioLocal.getDay(); // 0 = Domingo, 1 = Lunes...
    const diff = inicioLocal.getDate() - diaDeLaSemana + (diaDeLaSemana === 0 ? -6 : 1); // Ajuste para que la semana empiece en Lunes
    inicioLocal.setDate(diff);
    inicioLocal.setHours(0, 0, 0, 0);

    const inicioUTC = new Date(inicioLocal.getTime() - offsetMilisegundos);
    const finUTC = new Date(inicioUTC.getTime() + (7 * 24 * 60 * 60 * 1000) - 1);
    
    return { inicioUTC, finUTC };
}

/**
 * Obtiene el rango de fechas para el mes actual en una zona horaria específica.
 */
export function getMonthlyDateRange(offsetUTC) {
    const ahora = new Date();
    const offsetMilisegundos = offsetUTC * 60000;
    const inicioLocal = new Date(ahora.getTime() + offsetMilisegundos);

    // Obtener el inicio del mes
    inicioLocal.setDate(1);
    inicioLocal.setHours(0, 0, 0, 0);

    const inicioUTC = new Date(inicioLocal.getTime() - offsetMilisegundos);
    
    // El fin del mes es el inicio del mes siguiente, menos 1 milisegundo
    const finDelMesLocal = new Date(inicioLocal);
    finDelMesLocal.setMonth(finDelMesLocal.getMonth() + 1);
    finDelMesLocal.setHours(0, 0, 0, 0);
    const finUTC = new Date(finDelMesLocal.getTime() - offsetMilisegundos - 1);
    
    return { inicioUTC, finUTC };
}

/**
 * Obtiene la fecha y hora actual ajustada a una zona horaria específica.
 * @param {number} offsetUTC - El offset de la zona horaria en minutos (ej: -360 para UTC-6).
 * @returns {Date} - Un objeto Date que representa la hora actual en la zona horaria deseada.
 */
export function getCurrentTimeInTimezone(offsetUTC) {
    const ahora = new Date();
    // Calcula los milisegundos UTC actuales del servidor
    const utcNowMillis = ahora.getTime() + ahora.getTimezoneOffset() * 60000; 
    // Aplica el offset de la zona horaria deseada para obtener la hora local en milisegundos
    const targetLocalMillis = utcNowMillis + offsetUTC * 60000; 
    return new Date(targetLocalMillis);
}

// Puedes exportar un valor para Nicaragua directamente para facilitar su uso
export const NICARAGUA_OFFSET_MINUTES = -6 * 60; // UTC-6