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

// User interface
export interface User {
  id: string;
  username: string;
  email: string;
  role?: {
    id: string;
    name: string;
    type: string;
  };
  jwt?: string;
}

// User state
export const auth = $state<{
  user: User | null;
  loading: boolean;
  error: string | null;
}>({
  user: null,
  loading: false,
  error: null
});

// Getter functions for state
export function getUser(): User | null {
  return auth.user;
}

export function getLoading(): boolean {
  return auth.loading;
}

export function getError(): string | null {
  return auth.error;
}

// Derived value getter functions
export function isAuthenticated(): boolean {
  return !!auth.user;
}

export function getUserRole(): string {
  return auth.user?.role?.type || 'guest';
}

export function getUserRoleDisplay(): string {
  return getRoleDisplayName(getUserRole());
}

export function isFuneralDirector(): boolean {
  return getUserRole() === 'funeral_director';
}

export function isFamilyContact(): boolean {
  return getUserRole() === 'family_contact';
}

/**
 * Login user with email and password
 * @param identifier Email or username
 * @param password User password
 * @returns Success status
 */
export async function login(identifier: string, password: string): Promise<boolean> {
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
    
    logger.success("Login successful", {
      username: auth.user?.username,
      role: auth.user?.role?.type
    });
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
 * @param userData User registration data
 * @returns Success status
 */
export async function register(userData: {
  username: string;
  email: string;
  password: string;
  [key: string]: any;
}): Promise<boolean> {
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
    
    logger.success("Registration successful", { username: auth.user?.username });
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
 * @returns Success status
 */
export async function logout(): Promise<boolean> {
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
 * @param userData User data from server
 */
export function setUser(userData: User | null): void {
  if (userData) {
    logger.info("Setting user data from server", {
      username: userData.username,
      role: userData.role?.type
    });
    auth.user = userData;
  } else {
    auth.user = null;
  }
}

/**
 * Check if a user has a specific role
 * @param requiredRole The role(s) to check for
 * @returns Whether the user has the required role
 */
export function hasRole(requiredRole: string | string[]): boolean {
  // If no user, they don't have any role
  if (!auth.user || !auth.user.role) return false;

  // If checking for multiple roles, check if user has any of them
  if (Array.isArray(requiredRole)) {
    return requiredRole.some(role => auth.user?.role?.type === role);
  }

  // Check for specific role
  return auth.user.role.type === requiredRole;
}

/**
 * Get a display-friendly name for a role
 * @param roleType The role type string
 * @returns A formatted display name for the role
 */
export function getRoleDisplayName(roleType: string): string {
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