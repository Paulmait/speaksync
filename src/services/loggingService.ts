import { ErrorHandlingService } from './errorHandlingService';
import { MonitoringService } from './monitoringService';
import { ErrorCategory, ErrorSeverity } from '../types/errorTypes';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogMetadata {
  [key: string]: string | number | boolean | null | undefined | LogMetadata;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  metadata?: LogMetadata;
  stack?: string;
  userId?: string;
  sessionId?: string;
}

export class LoggingService {
  private static instance: LoggingService;
  private minLogLevel: LogLevel = __DEV__ ? LogLevel.DEBUG : LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogEntries = 1000;
  private errorHandlingService: ErrorHandlingService;
  private monitoringService: MonitoringService;

  private constructor() {
    this.errorHandlingService = ErrorHandlingService.getInstance();
    this.monitoringService = MonitoringService.getInstance();
  }

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  public setMinLogLevel(level: LogLevel): void {
    this.minLogLevel = level;
  }

  public debug(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  public info(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  public warn(message: string, metadata?: LogMetadata): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  public error(message: string, error?: Error, metadata?: LogMetadata): void {
    const logMetadata: LogMetadata = {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };

    this.log(LogLevel.ERROR, message, logMetadata, error?.stack);

    // Also report to error handling service
    if (error) {
      this.errorHandlingService.handleError(error, {
        category: ErrorCategory.RUNTIME,
        severity: ErrorSeverity.MEDIUM,
        context: metadata,
      });
    }
  }

  public fatal(message: string, error?: Error, metadata?: LogMetadata): void {
    const logMetadata: LogMetadata = {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };

    this.log(LogLevel.FATAL, message, logMetadata, error?.stack);

    // Report to error handling service with high severity
    if (error) {
      this.errorHandlingService.handleError(error, {
        category: ErrorCategory.RUNTIME,
        severity: ErrorSeverity.HIGH,
        context: metadata,
      });
    }
  }

  private log(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata,
    stack?: string
  ): void {
    if (level < this.minLogLevel) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      metadata,
      stack,
    };

    // Add to in-memory log
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogEntries) {
      this.logs.shift();
    }

    // Output to console in development
    if (__DEV__) {
      this.outputToConsole(logEntry);
    }

    // Send to monitoring service for production logging
    this.sendToMonitoring(logEntry);
  }

  private outputToConsole(entry: LogEntry): void {
    // Only output to console in development mode
    if (!__DEV__) return;
    
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] ${LogLevel[entry.level]}:`;
    
    // Use native console methods with disable eslint
    switch (entry.level) {
      case LogLevel.DEBUG:
        // eslint-disable-next-line no-console
        console.debug(prefix, entry.message, entry.metadata);
        break;
      case LogLevel.INFO:
        // eslint-disable-next-line no-console
        console.info(prefix, entry.message, entry.metadata);
        break;
      case LogLevel.WARN:
        // eslint-disable-next-line no-console
        console.warn(prefix, entry.message, entry.metadata);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        // eslint-disable-next-line no-console
        console.error(prefix, entry.message, entry.metadata);
        if (entry.stack) {
          // eslint-disable-next-line no-console
          console.error('Stack:', entry.stack);
        }
        break;
    }
  }

  private sendToMonitoring(entry: LogEntry): void {
    try {
      // Send structured logs to monitoring service
      this.monitoringService.captureEvent('app_log', {
        level: LogLevel[entry.level],
        message: entry.message,
        timestamp: entry.timestamp,
        metadata: entry.metadata,
        stack: entry.stack,
      });
    } catch (error) {
      // Fallback logging - only in development
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to send log to monitoring service:', error);
      }
    }
  }

  public getLogs(
    level?: LogLevel,
    category?: ErrorCategory,
    limit?: number
  ): LogEntry[] {
    let filteredLogs = this.logs;

    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= level);
    }

    if (category !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }

    if (limit !== undefined) {
      filteredLogs = filteredLogs.slice(-limit);
    }

    return filteredLogs;
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Convenience methods for common logging patterns
  public logApiCall(
    method: string,
    url: string,
    status?: number,
    duration?: number,
    error?: Error
  ): void {
    const metadata = {
      method,
      url,
      status,
      duration,
      category: 'api',
    };

    if (error) {
      this.error(`API call failed: ${method} ${url}`, error, metadata);
    } else {
      this.info(`API call: ${method} ${url}`, metadata);
    }
  }

  public logUserAction(action: string, metadata?: Record<string, any>): void {
    this.info(`User action: ${action}`, {
      ...metadata,
      category: 'user_action',
    });
  }

  public logPerformance(
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    this.info(`Performance: ${operation} took ${duration}ms`, {
      ...metadata,
      duration,
      category: 'performance',
    });
  }

  public logServiceOperation(
    service: string,
    operation: string,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    const message = `${service}.${operation} ${success ? 'succeeded' : 'failed'}`;
    const logMetadata = {
      ...metadata,
      service,
      operation,
      success,
      category: 'service',
    };

    if (success) {
      this.info(message, logMetadata);
    } else {
      this.error(message, undefined, logMetadata);
    }
  }
}

// Export singleton instance
export const logger = LoggingService.getInstance();
