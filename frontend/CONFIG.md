# TributeStream Configuration System

This document describes the centralized configuration system for the TributeStream application.

## Overview

The configuration system provides a centralized way to manage environment-specific settings like API URLs, ports, timeouts, and feature flags. It supports multiple environments (development, staging, production) and loads configuration from environment variables with sensible defaults.

## Configuration Files

- `src/lib/config.ts` - Main configuration file
- `src/lib/backendChecker.ts` - Backend availability checker
- `.env.example` - Example environment variables file (copy to `.env` for local development)

## Environment Variables

All configuration options can be overridden using environment variables. The following variables are supported:

| Variable | Description | Default (Dev) |
|----------|-------------|---------------|
| `PUBLIC_ENVIRONMENT` | Environment name | `development` |
| `PUBLIC_API_BASE_URL` | Base URL for API endpoints | `/api` |
| `PUBLIC_STRAPI_URL` | URL for Strapi backend | `http://localhost` |
| `PUBLIC_STRAPI_PORT` | Port for Strapi backend | `1338` |
| `PUBLIC_API_TIMEOUT` | Request timeout (ms) | `10000` |
| `PUBLIC_RETRY_INTERVAL` | Retry interval (ms) | `10000` |
| `PUBLIC_MAX_RETRIES` | Maximum retries | `3` |
| `PUBLIC_AUTH_TOKEN_NAME` | Cookie name for JWT | `jwt` |
| `PUBLIC_AUTH_TOKEN_EXPIRY` | Token expiry (seconds) | `86400` (1 day) |
| `PUBLIC_ENABLE_BACKEND_CHECK` | Enable backend checking | `true` |

## Environment-Specific Configurations

The configuration system supports different environments with appropriate defaults:

### Development

- Longer timeouts for debugging
- Debug features enabled
- Default Strapi URL: `http://localhost:1338`

### Staging

- Moderate timeouts
- Some debug features enabled
- Default Strapi URL: `http://staging-api.tributestream.com:1338`

### Production

- Short timeouts
- Debug features disabled
- Default Strapi URL: `https://api.tributestream.com`

## Backend Availability Checker

The backend availability checker verifies that the Strapi backend is available and periodically retries connections if it's not. It provides a Svelte store to track the backend status and a UI component to display errors.

### Features

- Non-blocking connection verification
- User-friendly error display
- Periodic retry mechanism
- Manual retry button

## Usage

### In API Endpoints

```typescript
import config, { getStrapiUrl } from '$lib/config';

// Get the full Strapi URL (with port if needed)
const STRAPI_URL = getStrapiUrl();

// Use other configuration values
const timeout = config.api.timeout;
```

### Backend Status Component

```svelte
<script>
  import BackendStatus from '$lib/components/BackendStatus.svelte';
</script>

<BackendStatus />
```

## Local Development

For local development, copy `.env.example` to `.env` and modify as needed:

```bash
cp .env.example .env
```

## Validation

The configuration system validates required values and provides clear error messages if validation fails. In development mode, it logs the active configuration to the console.