import "server-only";

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export interface LogEntry {
  timestamp: string;
  level: "debug" | "info" | "warn" | "error" | "fatal";
  message: string;
  requestId?: string;
  context?: {
    route?: string;
    method?: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    [key: string]: any;
  };
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  duration?: number;
  meta?: Record<string, any>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private logLevel: number = this.getLevelIndex(
    (process.env.LOG_LEVEL || "info") as any
  );
  private logsDir = path.join(process.cwd(), "logs");

  private levelMap: Record<LogEntry["level"], number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  };

  constructor() {
    // Ensure logs directory exists
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  private getLevelIndex(level: LogEntry["level"]): number {
    return this.levelMap[level] || 1;
  }

  private formatLog(entry: LogEntry): string {
    if (this.isDevelopment) {
      return this.prettyPrint(entry);
    }
    return JSON.stringify(entry);
  }

  private prettyPrint(entry: LogEntry): string {
    const levelColors: Record<LogEntry["level"], string> = {
      debug: "\x1b[36m",
      info: "\x1b[32m",
      warn: "\x1b[33m",
      error: "\x1b[31m",
      fatal: "\x1b[35m",
    };

    const reset = "\x1b[0m";
    const color = levelColors[entry.level];
    const level = entry.level.toUpperCase().padEnd(5);
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();

    let line = `${color}[${timestamp}] ${level}${reset} ${entry.message}`;

    if (entry.requestId) {
      line += ` (${entry.requestId})`;
    }

    if (entry.context && Object.keys(entry.context).length > 0) {
      line += ` ${JSON.stringify(entry.context)}`;
    }

    if (entry.duration) {
      line += ` +${entry.duration}ms`;
    }

    if (entry.error) {
      line += ` ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack && this.isDevelopment) {
        line += `\n${entry.error.stack}`;
      }
    }

    if (entry.meta && Object.keys(entry.meta).length > 0) {
      line += ` ${JSON.stringify(entry.meta)}`;
    }

    return line;
  }

  private writeToFile(entry: LogEntry): void {
    if (entry.level !== "error" && entry.level !== "fatal") {
      return; // Only write errors to file
    }

    try {
      const errorLogPath = path.join(this.logsDir, "errors.log");
      const line = JSON.stringify(entry) + "\n";
      fs.appendFileSync(errorLogPath, line, "utf-8");
    } catch (err) {
      console.error("[logger] Failed to write to error log:", err);
    }
  }

  private log(entry: LogEntry): void {
    const levelIndex = this.getLevelIndex(entry.level);

    // Check if we should log based on log level
    if (levelIndex < this.logLevel) {
      return;
    }

    const formatted = this.formatLog(entry);

    if (entry.level === "error" || entry.level === "fatal") {
      console.error(formatted);
    } else if (entry.level === "warn") {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }

    this.writeToFile(entry);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: "debug",
      message,
      context,
    });
  }

  info(message: string, context?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: "info",
      message,
      context,
    });
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: "warn",
      message,
      context,
    });
  }

  error(
    message: string,
    error?: Error | unknown,
    context?: Record<string, any>
  ): void {
    let errorInfo: LogEntry["error"];

    if (error instanceof Error) {
      errorInfo = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error && typeof error === "object" && "message" in error) {
      errorInfo = {
        name: (error as any).name || "Unknown",
        message: (error as any).message || String(error),
        stack: (error as any).stack,
      };
    } else {
      errorInfo = {
        name: "Error",
        message: String(error || "Unknown error"),
      };
    }

    this.log({
      timestamp: new Date().toISOString(),
      level: "error",
      message,
      error: errorInfo,
      context,
    });
  }

  fatal(message: string, context?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: "fatal",
      message,
      context,
    });
  }

  api(
    req: { method: string; nextUrl: { pathname: string } },
    message: string,
    meta?: Record<string, any>
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: "info",
      message,
      context: {
        route: req.nextUrl.pathname,
        method: req.method,
      },
      meta,
    });
  }
}

export const logger = new Logger();

export function generateRequestId(): string {
  return crypto.randomBytes(16).toString("hex");
}

export default logger;
