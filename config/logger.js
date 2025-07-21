// config/logger.js
import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, errors, printf } = format;

const logFormat = printf(({ timestamp, level, message, stack }) => {
  return `${timestamp} [${level.toUpperCase()}] ${message} ${stack ? '\n' + stack : ''}`;
});

// Transportes con rotación
const errorTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  zippedArchive: true,
  maxSize: '5m',
  maxFiles: '14d' // guarda solo 14 días
});

const combinedTransport = new DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '10m',
  maxFiles: '30d' // guarda solo 30 días
});

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new transports.Console(),        // sigue mostrando por consola
    errorTransport,                  // logs de error rotados
    combinedTransport                // logs generales rotados
  ]
});

export default logger;
