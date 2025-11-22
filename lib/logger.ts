import winston from "winston";
import path from "path";
import fs from "fs";

// Global type declarations for request tracking
declare global {
  var __requestId: string | undefined;
  var __correlationId: string | undefined;
}

interface SafeInfo extends winston.Logform.TransformableInfo {
  metadata?: { error: string };
  requestId?: string;
  correlationId?: string;
}

// Ensure logs directory exists in production
const logDir = path.resolve("./logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Log color mapping
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

winston.addColors(colors);

const isProduction = process.env.NODE_ENV === "production";

// Safely serialize metadata (avoids circular JSON error)
const safeJson = winston.format((info: winston.Logform.TransformableInfo) => {
  try {
    JSON.stringify(info);
    return info;
  } catch {
    const safeInfo = { ...info } as SafeInfo;
    safeInfo.metadata = { error: "CIRCULAR_DATA" };
    return safeInfo;
  }
});

// Add request ID support
const addRequestId = winston.format((info: winston.Logform.TransformableInfo) => {
  const safeInfo = { ...info } as SafeInfo;
  safeInfo.requestId = global.__requestId || undefined;
  safeInfo.correlationId = global.__correlationId || undefined;
  return safeInfo;
});

// Production format (JSON structured logging)
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  safeJson(),
  addRequestId(),
  winston.format.json()
);

// Development format (pretty, colorized)
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  addRequestId(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr =
      Object.keys(meta).length > 0
        ? "\n" + JSON.stringify(meta, null, 2)
        : "";
    return `${timestamp} [${level}] → ${message}${metaStr}`;
  })
);

export const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  levels,
  format: isProduction ? productionFormat : developmentFormat,
  handleExceptions: true,
  handleRejections: true,
  exitOnError: false,
  transports: [
    new winston.transports.Console(),

    ...(isProduction
      ? [
          new winston.transports.File({
            filename: path.join(logDir, "error.log"),
            level: "error",
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
            tailable: true,
          }),
          new winston.transports.File({
            filename: path.join(logDir, "combined.log"),
            maxsize: 10 * 1024 * 1024,
            maxFiles: 10,
            tailable: true,
          }),
        ]
      : []),
  ],
});

// Morgan HTTP integration
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Request log interface
export interface RequestLogData {
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
  responseTime: number;
  statusCode: number;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

// Performance logger
export const logPerformance = (
  operation: string,
  duration: number,
  metadata?: Record<string, unknown>
) => {
  logger.info(`Performance: ${operation}`, Object.assign({
    duration,
    slow: duration > 1000,
  }, metadata));
};

// Security event logger
export const logSecurity = (
  event: string,
  severity: "low" | "medium" | "high" | "critical",
  data: Record<string, unknown>
) => {
  const level =
    severity === "critical" || severity === "high"
      ? "error"
      : severity === "medium"
      ? "warn"
      : "info";

  logger.log(level, `Security: ${event}`, Object.assign({
    severity,
    timestamp: new Date().toISOString(),
  }, data));
};

// Business metrics logger
export const logMetric = (
  metric: string,
  value: number,
  tags?: Record<string, string>
) => {
  logger.info(`Metric: ${metric}`, {
    value,
    tags: tags || {},
    timestamp: new Date().toISOString(),
  });
};

// API request logger
export const logApiRequest = (data: RequestLogData) => {
  const level =
    data.statusCode >= 500
      ? "error"
      : data.statusCode >= 400
      ? "warn"
      : "info";

  logger.log(level, `API ${data.method} ${data.url}`, Object.assign({}, data, {
    slow: data.responseTime > 3000,
  }));
};

// Database logger
export const logDatabase = (
  operation: string,
  collection: string,
  duration: number,
  success: boolean,
  error?: unknown
) => {
  logger.info(`Database: ${operation}`, Object.assign({
    collection,
    duration,
    success,
    slow: duration > 150,
  }, error && typeof error === 'object' && error !== null && 'message' in error && { error: (error as { message: string }).message }));
};

// Graceful shutdown
export const closeLogger = async () => {
  return new Promise<void>((resolve) => {
    logger.on("finish", resolve);
    logger.end();
  });
};

export default logger;
