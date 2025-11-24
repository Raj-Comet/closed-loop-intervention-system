import logger from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loggerInstance = logger.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logger.format.combine(
    logger.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logger.format.errors({ stack: true }),
    logger.format.json()
  ),
  defaultMeta: { service: 'closed-loop-backend' },
  transports: [
    new logger.transports.File({ filename: path.join(__dirname, '../../logs/error.log'), level: 'error' }),
    new logger.transports.File({ filename: path.join(__dirname, '../../logs/combined.log') }),
    new logger.transports.Console({
      format: logger.format.combine(
        logger.format.colorize(),
        logger.format.simple()
      ),
    }),
  ],
});

export default loggerInstance;
