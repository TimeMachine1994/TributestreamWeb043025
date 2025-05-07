/**
 * TributeStream Centralized Configuration
 *
 * This file provides a centralized configuration system for the TributeStream application.
 * It supports multiple environments (development, staging, production) and loads
 * configuration from environment variables with sensible defaults.
 */

import { dev } from '$app/environment';
import { browser } from '$app/environment';
import { createLogger } from '$lib/logger';
import { PUBLIC_STRAPI_URL } from '$env/static/public';
// Create a dedicated logger for configuration
const logger = createLogger('Config');

/**
 * Application environment types
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * Complete application configuration interface
 */
export interface AppConfig {
  // Current environment
  environment: Environment;
  
  // API settings
  api: {
    baseUrl: string;       // Base URL for frontend API endpoints
    strapiUrl: string;     // URL for Strapi backend
    port: number;          // Port for Strapi backend
    timeout: number;       // API request timeout in milliseconds
    retryInterval: number; // Interval for retry attempts in milliseconds
    maxRetries: number;    // Maximum number of retry attempts
  };
  
  // Auth settings
  auth: {
    tokenName: string;     // Name of the cookie storing the JWT
    tokenExpiry: number;   // Token expiry time in seconds
  };
  
  // Feature flags
  features: {
    enableBackendCheck: boolean; // Whether to enable backend availability checking
    // Add other feature flags as needed
  };
}

/**
 * Detect the current environment
 * Priority: 
 * 1. Environment variable
 * 2. Development mode detection
 * 3. Default to production
 */
function detectEnvironment(): Environment {
  // Check for environment variable
  const envFromVar = import.meta.env.PUBLIC_ENVIRONMENT;
  
  // Log all environment variables for debugging
  logger.debug('Environment variables:', {
 
    dev: dev
  });
  
  if (envFromVar) {
    if (['development', 'staging', 'production'].includes(envFromVar)) {
      logger.debug(`Using environment from variable: ${envFromVar}`);
      return envFromVar as Environment;
    }
    logger.warning(`Invalid environment value: ${envFromVar}, falling back to detection`);
  } else {
    logger.debug('PUBLIC_ENVIRONMENT variable not found, falling back to detection');
  }
  
  // Use development mode detection
  const detectedEnv = dev ? 'development' : 'production';
  logger.debug(`Detected environment based on dev flag: ${detectedEnv}`);
  return detectedEnv;
}

// Default Strapi URL from environment variable - will be used by all environments
const DEFAULT_STRAPI_URL = 'https://miraculous-morning-0acdf6e165.strapiapp.com';

/**
 * Environment-specific configurations with defaults
 */
const configs: Record<Environment, AppConfig> = {
  // Development environment configuration
  development: {
    environment: 'development',
    api: {
      baseUrl: '/api',
      strapiUrl: DEFAULT_STRAPI_URL,
      port: 443, // HTTPS default port
      timeout: 8000,         // 8 seconds
      retryInterval: 5000,   // 5 seconds
      maxRetries: 5
    },
    auth: {
      tokenName: 'jwt',
      tokenExpiry: 86400     // 1 day
    },
    features: {
      enableBackendCheck: true
    }
  },
  
  // Staging environment configuration
  staging: {
    environment: 'staging',
    api: {
      baseUrl: '/api',
      strapiUrl: DEFAULT_STRAPI_URL,
      port: 443, // HTTPS default port
      timeout: 8000,         // 8 seconds
      retryInterval: 15000,  // 15 seconds
      maxRetries: 2
    },
    auth: {
      tokenName: 'jwt',
      tokenExpiry: 43200     // 12 hours
    },
    features: {
      enableBackendCheck: true
    }
  },
  
  // Production environment configuration
  production: {
    environment: 'production',
    api: {
      baseUrl: '/api',
      strapiUrl: DEFAULT_STRAPI_URL,
      port: 443,             // HTTPS default port
      timeout: 5000,         // 5 seconds
      retryInterval: 30000,  // 30 seconds
      maxRetries: 1
    },
    auth: {
      tokenName: 'jwt',
      tokenExpiry: 43200     // 12 hours
    },
    features: {
      enableBackendCheck: true
    }
  }
};

/**
 * Load configuration from environment variables
 * @param baseConfig The base configuration to override
 * @returns The configuration with environment variable overrides
 */
function loadFromEnvironment(baseConfig: AppConfig): AppConfig {
  const config = { ...baseConfig };
  const env = import.meta.env;
  
  // API settings
  if (env.PUBLIC_API_BASE_URL) {
    config.api.baseUrl = env.PUBLIC_API_BASE_URL;
  }
  
  if (env.PUBLIC_STRAPI_URL) {
    // Always use the PUBLIC_STRAPI_URL environment variable when available
    config.api.strapiUrl = env.PUBLIC_STRAPI_URL;
    logger.debug(`Using Strapi URL from environment variable: ${config.api.strapiUrl}`);
  } else {
    logger.debug(`Using default Strapi URL: ${config.api.strapiUrl}`);
  }
  
  // Port is usually not needed with the full URL, but kept for compatibility
  if (env.PUBLIC_STRAPI_PORT) {
    const port = parseInt(env.PUBLIC_STRAPI_PORT, 10);
    if (!isNaN(port)) {
      config.api.port = port;
    }
  }
  
  if (env.PUBLIC_API_TIMEOUT) {
    const timeout = parseInt(env.PUBLIC_API_TIMEOUT, 10);
    if (!isNaN(timeout)) {
      config.api.timeout = timeout;
    }
  }
  
  if (env.PUBLIC_RETRY_INTERVAL) {
    const interval = parseInt(env.PUBLIC_RETRY_INTERVAL, 10);
    if (!isNaN(interval)) {
      config.api.retryInterval = interval;
    }
  }
  
  if (env.PUBLIC_MAX_RETRIES) {
    const retries = parseInt(env.PUBLIC_MAX_RETRIES, 10);
    if (!isNaN(retries)) {
      config.api.maxRetries = retries;
    }
  }
  
  // Auth settings
  if (env.PUBLIC_AUTH_TOKEN_NAME) {
    config.auth.tokenName = env.PUBLIC_AUTH_TOKEN_NAME;
  }
  
  if (env.PUBLIC_AUTH_TOKEN_EXPIRY) {
    const expiry = parseInt(env.PUBLIC_AUTH_TOKEN_EXPIRY, 10);
    if (!isNaN(expiry)) {
      config.auth.tokenExpiry = expiry;
    }
  }
  
  // Feature flags
  if (env.PUBLIC_ENABLE_BACKEND_CHECK) {
    config.features.enableBackendCheck =
      env.PUBLIC_ENABLE_BACKEND_CHECK.toLowerCase() === 'true';
  }
  
  return config;
}

/**
 * Validate the configuration
 * @param config The configuration to validate
 * @returns The validated configuration
 * @throws Error if validation fails
 */
function validateConfig(config: AppConfig): AppConfig {
  // Required fields for all environments
  if (!config.api.baseUrl) {
    throw new Error('API base URL is required');
  }
  
  if (!config.api.strapiUrl) {
    throw new Error('Strapi URL is required');
  }
  
  // Production-specific validations
  if (config.environment === 'production') {
    // In production, we might want to enforce stricter validations
    if (config.api.strapiUrl.includes('localhost')) {
      throw new Error('Production environment cannot use localhost for Strapi URL');
    }
  }
  
  return config;
}

// Detect the current environment
const environment = detectEnvironment();

// Get the base configuration for the current environment
let baseConfig = configs[environment];

// Override with environment variables
const config = loadFromEnvironment(baseConfig);

// Validate the configuration
try {
  validateConfig(config);
  logger.success(`Configuration loaded for ${environment} environment`);
  
  // Always log the active configuration, not just in development mode
  logger.debug('Active configuration', {
    environment: config.environment,
    strapiUrl: config.api.strapiUrl,
    port: config.api.port
  });
} catch (error) {
  logger.error('Configuration validation failed', { error });
  
  if (browser) {
    // In the browser, we can continue with the invalid config
    // The application will show appropriate errors
    logger.warning('Continuing with invalid configuration in browser');
  } else {
    // In SSR, we should fail fast
    throw error;
  }
}

// Export the active configuration
export default config;

// Helper function to get the full Strapi URL (with port if needed)
export function getStrapiUrl(): string {
  const { strapiUrl, port } = config.api;
  
  // If the URL already includes a port or it's a standard HTTP/HTTPS port, don't add the port
  if (
    strapiUrl.includes(':') || 
    (strapiUrl.startsWith('http://') && port === 80) ||
    (strapiUrl.startsWith('https://') && port === 443)
  ) {
    return strapiUrl;
  }
  
  return `${strapiUrl}:${port}`;
}