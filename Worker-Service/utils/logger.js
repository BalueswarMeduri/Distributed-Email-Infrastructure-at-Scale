import winston from "winston";
import LokiTransport from "winston-loki";

const lokiHost = process.env.LOKI_HOST || "http://127.0.0.1:3100";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: "worker-service" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `[${timestamp || new Date().toISOString()}] [${level}] ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ""
          }`;
        })
      )
    }),
    new LokiTransport({
      host: lokiHost,
      labels: { app: "worker-service" },
      json: true,
      batching: false,
      gracefulShutdown: true,
      replaceTimestamp: true,
      onConnectionError: (err) => {
        console.warn(`[Loki Warning] worker-service: ${err.message}`);
      }
    })
  ]
});

export default logger;
