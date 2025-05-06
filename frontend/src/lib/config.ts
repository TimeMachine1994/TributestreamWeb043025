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
  // TEMPORARY FIX: Hardcode to production environment
  // This bypasses the environment variable detection which is not working
  logger.debug('Using hardcoded production environment');
  return 'production';
  
  /* Original code commented out for reference
  // Check for environment variable
  const envFromVar = import.meta.env.PUBLIC_ENVIRONMENT;
  
  // Log all environment variables for debugging
  logger.debug('Environment variables:', {
    PUBLIC_ENVIRONMENT: import.meta.env.PUBLIC_ENVIRONMENT,
    PUBLIC_STRAPI_URL: import.meta.env.PUBLIC_STRAPI_URL,
    PUBLIC_STRAPI_PORT: import.meta.env.PUBLIC_STRAPI_PORT,
    dev: dev
  });
  
  if (envFromVar) {
    if (['development', 'staging', 'production'].includes(envFromVar)) {
      logger.debug(`Using environment from variable: ${envFromVar}`);
      return envFromVar as Environment;
    }
    logger.warning(`Invalid environment value: ${envFromVar}, falling back to detection`);
  } else {
    logger.warning('PUBLIC_ENVIRONMENT variable not found, falling back to detection');
  }
  
  // Use development mode detection
  const detectedEnv = dev ? 'development' : 'production';
  logger.debug(`Detected environment based on dev flag: ${detectedEnv}`);
  return detectedEnv;
  */
}

/**
 * Environment-specific configurations with defaults
 */
const configs: Record<Environment, AppConfig> = {
  // Development environment configuration
  development: {
    environment: 'development',
    api: {
      baseUrl: '/api',
      strapiUrl: 'http://localhost:1338',
      port: 1338,
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
      strapiUrl: 'http://staging-api.tributestream.com',
      port: 1338,
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
      strapiUrl: 'https://miraculous-morning-0acdf6e165.strapiapp.com',
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
    config.api.strapiUrl = env.PUBLIC_STRAPI_URL;
  }
  
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