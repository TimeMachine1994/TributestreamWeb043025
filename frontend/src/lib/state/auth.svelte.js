/**
 * Authentication State Module - Svelte 5 Runes Implementation
 * 
 * This module provides authentication state management using Svelte 5 runes.
 * It handles user login, logout, and role-based access control.
 */

import { goto } from '$app/navigation';
import { getStrapiUrl } from '$lib/config';
import { createLogger } from '$lib/logger';
import { clearTributes } from '$lib/api/tributes.svelte';

// Create a dedicated logger
const logger = createLogger('AuthState');

// User state
export const auth = $state({
  user: null,
  loading: false,
  error: null
});

// Getter functions for state
export function getUser() {
  return auth.user;
}

export function getLoading() {
  return auth.loading;
}

export function getError() {
  return auth.error;
}

// Derived value getter functions
export function isAuthenticated() {
  return !!auth.user;
}

export function getUserRole() {
  return auth.user?.role?.type || 'guest';
}

export function getUserRoleDisplay() {
  return getRoleDisplayName(getUserRole());
}

export function isFuneralDirector() {
  return getUserRole() === 'funeral_director';
}

export function isFamilyContact() {
  return getUserRole() === 'family_contact';
}


/**
 * Login user with email and password
 * @param {string} identifier Email or username
 * @param {string} password User password
 * @returns {Promise<boolean>} Success status
 */
export async function login(identifier, password) {
  auth.loading = true;
  auth.error = null;
  
  try {
    logger.info("Attempting login", { identifier });
    
    const response = await fetch(`${getStrapiUrl()}/api/auth/local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier,
        password
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Login failed');
    }
    
    // Set user data
    auth.user = {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      role: data.user.role,
      jwt: data.jwt
    };
    
    logger.success("Login successful", { username: auth.user.username, role: auth.user.role?.type });
    return true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("Login failed", { error: errorMessage });
    auth.error = errorMessage;
    return false;
  } finally {
    auth.loading = false;
  }
}

/**
 * Register a new user
 * @param {Object} userData User registration data
 * @returns {Promise<boolean>} Success status
 */
export async function register(userData) {
  auth.loading = true;
  auth.error = null;
  
  try {
    logger.info("Registering new user", { email: userData.email });
    
    const response = await fetch(`${getStrapiUrl()}/api/auth/local/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Registration failed');
    }
    
    // Set user data
    auth.user = {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      role: data.user.role,
      jwt: data.jwt
    };
    
    logger.success("Registration successful", { username: auth.user.username });
    return true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("Registration failed", { error: errorMessage });
    auth.error = errorMessage;
    return false;
  } finally {
    auth.loading = false;
  }
}

/**
 * Logout the current user
 * @returns {Promise<boolean>} Success status
 */
export async function logout() {
  auth.loading = true;
  
  try {
    logger.info("Logging out user", { username: auth.user?.username });
    
    const response = await fetch('/api/login', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Logout failed');
    }
    
    // Clear user data
    auth.user = null;
    
    // Clear other state
    clearTributes();
    
    logger.success("Logout successful");
    
    // Redirect to home page
    goto('/', { invalidateAll: true });
    
    return true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("Logout failed", { error: errorMessage });
    auth.error = errorMessage;
    return false;
  } finally {
    auth.loading = false;
  }
}

/**
 * Set user data from server-side authentication
 * @param {Object} userData User data from server
 */
export function setUser(userData) {
  if (userData) {
    logger.info("Setting user data from server", { username: userData.username, role: userData.role?.type });
    auth.user = userData;
  } else {
    auth.user = null;
  }
}

/**
 * Check if a user has a specific role
 * @param {string|string[]} requiredRole The role(s) to check for
 * @returns {boolean} Whether the user has the required role
 */
export function hasRole(requiredRole) {
  // If no user, they don't have any role
  if (!auth.user) return false;

  // If checking for multiple roles, check if user has any of them
  if (Array.isArray(requiredRole)) {
    return requiredRole.some(role => auth.user.role.type === role);
  }

  // Check for specific role
  return auth.user.role.type === requiredRole;
}

/**
 * Get a display-friendly name for a role
 * @param {string} roleType The role type string
 * @returns {string} A formatted display name for the role
 */
export function getRoleDisplayName(roleType) {
  if (!roleType || roleType === 'guest') return 'Guest';
  
  switch (roleType) {
    case 'funeral_director':
      return 'Funeral Director';
    case 'family_contact':
      return 'Family Contact';
    case 'authenticated':
      return 'Authenticated User';
    default:
      return roleType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}