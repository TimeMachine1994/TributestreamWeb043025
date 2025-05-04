/**
 * Logger utility for consistent console logging with emojis
 */

type LogLevel = 'info' | 'error' | 'warning' | 'success' | 'debug';

interface LogOptions {
  prefix?: string;
  data?: any;
}

/**
 * Base logging function with emoji and styling
 */
function log(level: LogLevel, message: string, options: LogOptions = {}) {
  const { prefix, data } = options;
  
  const styles = {
    info: 'color: #3498db; font-weight: bold',
    error: 'color: #e74c3c; font-weight: bold',
    warning: 'color: #f39c12; font-weight: bold',
    success: 'color: #2ecc71; font-weight: bold',
    debug: 'color: #9b59b6; font-weight: bold'
  };
  
  const emojis = {
    info: '📘',
    error: '🔥',
    warning: '⚠️',
    success: '✅',
    debug: '🔍'
  };

  const timestamp = new Date().toISOString();
  const prefixStr = prefix ? `[${prefix}] ` : '';
  
  console.log(
    `%c${emojis[level]} ${timestamp} ${prefixStr}${message}`,
    styles[level]
  );
  
  if (data !== undefined) {
    console.log(data);
  }
}

/**
 * Log informational messages
 */
export function info(message: string, options: LogOptions = {}) {
  log('info', message, options);
}

/**
 * Log error messages
 */
export function error(message: string, options: LogOptions = {}) {
  log('error', message, options);
}

/**
 * Log warning messages
 */
export function warning(message: string, options: LogOptions = {}) {
  log('warning', message, options);
}

/**
 * Log success messages
 */
export function success(message: string, options: LogOptions = {}) {
  log('success', message, options);
}

/**
 * Log debug messages
 */
export function debug(message: string, options: LogOptions = {}) {
  log('debug', message, options);
}

/**
 * Create a logger instance with a fixed prefix
 */
export function createLogger(prefix: string) {
  return {
    info: (message: string, data?: any) => info(message, { prefix, data }),
    error: (message: string, data?: any) => error(message, { prefix, data }),
    warning: (message: string, data?: any) => warning(message, { prefix, data }),
    success: (message: string, data?: any) => success(message, { prefix, data }),
    debug: (message: string, data?: any) => debug(message, { prefix, data })
  };
}

// Default export for convenience
export default {
  info,
  error,
  warning,
  success,
  debug,
  createLogger
};