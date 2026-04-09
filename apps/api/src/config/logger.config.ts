/* eslint-disable @typescript-eslint/no-base-to-string */
import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

/** Creates Winston logger configuration for NestJS API. */
export const createLoggerConfig = (
  serviceName = 'english-pro-api',
): WinstonModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  const transports: winston.transport[] = [];
  if (isProduction) {
    const gcpProjectId = process.env.GCP_PROJECT_ID;
    if (!gcpProjectId) throw new Error('GCP_PROJECT_ID is required in production for Cloud Logging.');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { LoggingWinston } = require('@google-cloud/logging-winston');
    transports.push(new LoggingWinston({
      projectId: gcpProjectId,
      logName: serviceName,
      labels: { service: serviceName, environment: 'production' },
    }));
  } else {
    transports.push(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.colorize({ all: true }),
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
          const ctx = context ? `[${String(context)}]` : '';
          const m = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp as string} ${level} ${ctx} ${message as string}${m}`;
        }),
      ),
    }));
  }
  return {
    transports,
    level: isProduction ? 'info' : 'debug',
    defaultMeta: { service: serviceName },
  };
};
/** Alias for acceptance test compatibility */
export const loggerConfig = createLoggerConfig;
