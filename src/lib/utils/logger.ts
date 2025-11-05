/**
 * Logger utility for development and production environments
 * Automatically disables logging in production to prevent sensitive data exposure
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  prefix?: string;
}

class Logger {
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      enabled: import.meta.env.DEV, // Only enable in development
      prefix: config?.prefix || '[APP]',
    };
  }

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const contextStr = context ? ` [${context}]` : '';
    return `${this.config.prefix}${contextStr} [${level.toUpperCase()}] [${timestamp}] ${message}`;
  }

  private log(level: LogLevel, message: string, data?: any, context?: string): void {
    if (!this.config.enabled) return;

    const formattedMessage = this.formatMessage(level, message, context);

    switch (level) {
      case 'debug':
        if (data !== undefined) {
          console.debug(formattedMessage, data);
        } else {
          console.debug(formattedMessage);
        }
        break;
      case 'info':
        if (data !== undefined) {
          console.info(formattedMessage, data);
        } else {
          console.info(formattedMessage);
        }
        break;
      case 'warn':
        if (data !== undefined) {
          console.warn(formattedMessage, data);
        } else {
          console.warn(formattedMessage);
        }
        break;
      case 'error':
        if (data !== undefined) {
          console.error(formattedMessage, data);
        } else {
          console.error(formattedMessage);
        }
        break;
    }
  }

  /**
   * Log debug information (only in development)
   * Use for detailed debugging information
   */
  debug(message: string, data?: any, context?: string): void {
    this.log('debug', message, data, context);
  }

  /**
   * Log general information (only in development)
   * Use for general application flow information
   */
  info(message: string, data?: any, context?: string): void {
    this.log('info', message, data, context);
  }

  /**
   * Log warnings (only in development)
   * Use for potentially problematic situations
   */
  warn(message: string, data?: any, context?: string): void {
    this.log('warn', message, data, context);
  }

  /**
   * Log errors (works in both dev and production)
   * Use for error situations that need to be tracked
   * Note: In production, consider sending to error tracking service
   */
  error(message: string, error?: any, context?: string): void {
    // Errors should always be logged, even in production
    const wasEnabled = this.config.enabled;
    this.config.enabled = true;

    if (error instanceof Error) {
      this.log('error', message, {
        name: error.name,
        message: error.message,
        stack: import.meta.env.DEV ? error.stack : undefined // Only show stack in dev
      }, context);
    } else {
      this.log('error', message, error, context);
    }

    this.config.enabled = wasEnabled;
  }

  /**
   * Create a child logger with a specific context
   * Useful for module-specific logging
   */
  createChild(context: string): Logger {
    const childLogger = new Logger({ prefix: this.config.prefix });
    const originalLog = childLogger.log.bind(childLogger);

    childLogger.log = (level: LogLevel, message: string, data?: any, ctx?: string) => {
      originalLog(level, message, data, ctx || context);
    };

    return childLogger;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience methods for specific contexts
export const authLogger = logger.createChild('AUTH');
export const firestoreLogger = logger.createChild('FIRESTORE');
export const roomLogger = logger.createChild('ROOM');
export const gameLogger = logger.createChild('GAME');
