/**
 * Calculator State Module - Svelte 5 Runes Implementation
 * 
 * This module manages the calculator state and provides functions
 * for saving, retrieving, and managing calculator sessions.
 */

import { browser } from '$app/environment';
import { createLogger } from '$lib/logger';
import * as cache from '$lib/cache/cache.svelte';
import { getUser } from '$lib/state/auth.svelte';

// Create a dedicated logger
const logger = createLogger('CalculatorState');

// Types
export interface CalculatorLocation {
  name: string;
  address: string;
  startTime: string;
  duration: number;
}

export interface CalculatorFormData {
  id?: string;
  customerName: string;
  email: string;
  phoneNumber: string;
  livestreamDate: string;
  livestreamTime: string;
  livestreamLocation: string;
  livestreamAtFuneralHome: boolean;
  selectedPackage: string;
  livestreamDuration: number;
  additionalLocations: {
    secondAddress: boolean;
    thirdAddress: boolean;
  };
  secondAddress?: string;
  thirdAddress?: string;
  urlFriendlyText: string;
  totalCost: number;
  tributeId?: string;
}

export interface CalculatorData extends Omit<CalculatorFormData, 'secondAddress' | 'thirdAddress'> {
  id: string;
  locations: CalculatorLocation[];
  savedAt: number;
  checkoutStatus: 'pending' | 'completed' | 'saved';
}

// Cache namespace for calculator data
const CACHE_NAMESPACE = 'calculator';

// Cache TTL for calculator data (7 days)
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

/**
 * Save calculator data to cache
 * @param data Calculator data to save
 * @returns The saved calculator data with ID
 */
export function saveCalculatorData(data: CalculatorFormData): CalculatorData {
  // Generate a unique ID if not provided
  const id = data.id || `calc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Create locations array from form data
  const locations: CalculatorLocation[] = [
    {
      name: 'Primary Location',
      address: data.livestreamLocation,
      startTime: data.livestreamTime,
      duration: data.livestreamDuration
    }
  ];
  
  // Add additional locations if specified
  if (data.additionalLocations.secondAddress && data.secondAddress) {
    locations.push({
      name: 'Second Location',
      address: data.secondAddress,
      startTime: data.livestreamTime, // Default to same time
      duration: 1 // Default duration
    });
  }
  
  if (data.additionalLocations.thirdAddress && data.thirdAddress) {
    locations.push({
      name: 'Third Location',
      address: data.thirdAddress,
      startTime: data.livestreamTime, // Default to same time
      duration: 1 // Default duration
    });
  }
  
  // Create the complete calculator data object
  const calculatorData: CalculatorData = {
    ...data,
    id,
    locations,
    savedAt: Date.now(),
    checkoutStatus: 'saved'
  };
  
  // Get current user ID for namespacing
  const user = getUser();
  const userNamespace = user?.id ? `${CACHE_NAMESPACE}:${user.id}` : CACHE_NAMESPACE;
  
  // Save to cache
  cache.set(`session:${id}`, calculatorData, {
    ttl: CACHE_TTL,
    storageType: 'local', // Use localStorage for persistence
    namespace: userNamespace
  });
  
  logger.info('💾 Calculator data saved', { id, checkoutStatus: calculatorData.checkoutStatus });
  
  return calculatorData;
}

/**
 * Update calculator data checkout status
 * @param id Calculator session ID
 * @param status New checkout status
 * @returns Updated calculator data or null if not found
 */
export function updateCheckoutStatus(id: string, status: 'pending' | 'completed' | 'saved'): CalculatorData | null {
  // Get current user ID for namespacing
  const user = getUser();
  const userNamespace = user?.id ? `${CACHE_NAMESPACE}:${user.id}` : CACHE_NAMESPACE;
  
  // Get existing data
  const data = cache.get<CalculatorData>(`session:${id}`, { namespace: userNamespace });
  
  if (!data) {
    logger.warning('⚠️ Calculator data not found for status update', { id });
    return null;
  }
  
  // Update status
  const updatedData: CalculatorData = {
    ...data,
    checkoutStatus: status,
    savedAt: Date.now()
  };
  
  // Save updated data
  cache.set(`session:${id}`, updatedData, {
    ttl: CACHE_TTL,
    storageType: 'local',
    namespace: userNamespace
  });
  
  logger.info('🔄 Calculator checkout status updated', { id, status });
  
  return updatedData;
}

/**
 * Get calculator data by ID
 * @param id Calculator session ID
 * @returns Calculator data or null if not found
 */
export function getCalculatorData(id: string): CalculatorData | null {
  // Get current user ID for namespacing
  const user = getUser();
  const userNamespace = user?.id ? `${CACHE_NAMESPACE}:${user.id}` : CACHE_NAMESPACE;
  
  // Get from cache
  const data = cache.get<CalculatorData>(`session:${id}`, { namespace: userNamespace });
  
  if (!data) {
    logger.warning('⚠️ Calculator data not found', { id });
    return null;
  }
  
  logger.debug('📤 Retrieved calculator data', { id });
  return data;
}

/**
 * Get all saved calculator sessions for the current user
 * @param status Optional filter by checkout status
 * @returns Array of calculator data
 */
export function getAllCalculatorSessions(status?: 'pending' | 'completed' | 'saved'): CalculatorData[] {
  if (!browser) return [];
  
  // Get current user ID for namespacing
  const user = getUser();
  const userNamespace = user?.id ? `${CACHE_NAMESPACE}:${user.id}` : CACHE_NAMESPACE;
  
  const sessions: CalculatorData[] = [];
  
  // Scan localStorage for calculator sessions
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith(`cache:${userNamespace}:session:`)) {
        try {
          const rawData = localStorage.getItem(key);
          if (rawData) {
            const parsed = JSON.parse(rawData);
            
            // Check if expired
            if (Date.now() - parsed.timestamp <= parsed.ttl) {
              const sessionData = parsed.value as CalculatorData;
              
              // Filter by status if provided
              if (!status || sessionData.checkoutStatus === status) {
                sessions.push(sessionData);
              }
            }
          }
        } catch (err) {
          logger.error('❌ Error parsing calculator session', { 
            key, 
            error: err instanceof Error ? err.message : String(err) 
          });
        }
      }
    }
  } catch (err) {
    logger.error('❌ Error accessing localStorage', { 
      error: err instanceof Error ? err.message : String(err) 
    });
  }
  
  // Sort by savedAt (newest first)
  sessions.sort((a, b) => b.savedAt - a.savedAt);
  
  logger.debug('📋 Retrieved calculator sessions', { count: sessions.length });
  return sessions;
}

/**
 * Delete a calculator session
 * @param id Calculator session ID
 * @returns True if deleted successfully
 */
export function deleteCalculatorSession(id: string): boolean {
  // Get current user ID for namespacing
  const user = getUser();
  const userNamespace = user?.id ? `${CACHE_NAMESPACE}:${user.id}` : CACHE_NAMESPACE;
  
  // Remove from cache
  cache.remove(`session:${id}`, { namespace: userNamespace });
  
  logger.info('🗑️ Calculator session deleted', { id });
  return true;
}

/**
 * Associate a calculator session with a tribute
 * @param calculatorId Calculator session ID
 * @param tributeId Tribute ID
 * @returns Updated calculator data or null if not found
 */
export function associateWithTribute(calculatorId: string, tributeId: string): CalculatorData | null {
  // Get current user ID for namespacing
  const user = getUser();
  const userNamespace = user?.id ? `${CACHE_NAMESPACE}:${user.id}` : CACHE_NAMESPACE;
  
  // Get existing data
  const data = cache.get<CalculatorData>(`session:${calculatorId}`, { namespace: userNamespace });
  
  if (!data) {
    logger.warning('⚠️ Calculator data not found for tribute association', { calculatorId });
    return null;
  }
  
  // Update with tribute ID
  const updatedData: CalculatorData = {
    ...data,
    tributeId,
    savedAt: Date.now()
  };
  
  // Save updated data
  cache.set(`session:${calculatorId}`, updatedData, {
    ttl: CACHE_TTL,
    storageType: 'local',
    namespace: userNamespace
  });
  
  logger.info('🔗 Calculator session associated with tribute', { calculatorId, tributeId });
  
  return updatedData;
}