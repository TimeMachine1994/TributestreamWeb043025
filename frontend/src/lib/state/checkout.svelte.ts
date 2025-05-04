/**
 * Checkout Module - Svelte 5 Runes Implementation
 * 
 * This module manages the checkout process for calculator data,
 * handling the flow between calculator, checkout, and dashboard.
 */

import { goto } from '$app/navigation';
import { createLogger } from '$lib/logger';
import * as calculatorState from './calculatorState.svelte';
import type { CalculatorData } from './calculatorState.svelte';

// Create a dedicated logger
const logger = createLogger('Checkout');

// Current checkout session
let currentCheckoutSession = $state<string | null>(null);

// Payment status
let paymentProcessing = $state(false);
let paymentError = $state<string | null>(null);

/**
 * Start the checkout process for a calculator session
 * @param calculatorId Calculator session ID
 * @param immediate Whether to go to checkout immediately or save for later
 * @returns True if successful
 */
export function startCheckout(calculatorId: string, immediate: boolean = true): boolean {
  try {
    // Get calculator data
    const calculatorData = calculatorState.getCalculatorData(calculatorId);
    
    if (!calculatorData) {
      logger.error('❌ Calculator data not found for checkout', { calculatorId });
      return false;
    }
    
    // Update checkout status
    const updatedData = calculatorState.updateCheckoutStatus(
      calculatorId, 
      immediate ? 'pending' : 'saved'
    );
    
    if (!updatedData) {
      logger.error('❌ Failed to update calculator checkout status', { calculatorId });
      return false;
    }
    
    // Set current checkout session
    currentCheckoutSession = calculatorId;
    
    logger.info('🛒 Checkout process started', { 
      calculatorId, 
      immediate, 
      status: updatedData.checkoutStatus 
    });
    
    // Navigate to checkout page if immediate
    if (immediate) {
      goto(`/checkout?session=${calculatorId}`);
    } else {
      // Show confirmation message
      logger.info('💾 Checkout saved for later', { calculatorId });
    }
    
    return true;
  } catch (err) {
    logger.error('❌ Error starting checkout process', { 
      calculatorId, 
      error: err instanceof Error ? err.message : String(err) 
    });
    return false;
  }
}

/**
 * Resume a saved checkout session
 * @param calculatorId Calculator session ID
 * @returns True if successful
 */
export function resumeCheckout(calculatorId: string): boolean {
  try {
    // Get calculator data
    const calculatorData = calculatorState.getCalculatorData(calculatorId);
    
    if (!calculatorData) {
      logger.error('❌ Calculator data not found for resuming checkout', { calculatorId });
      return false;
    }
    
    // Update checkout status to pending
    const updatedData = calculatorState.updateCheckoutStatus(calculatorId, 'pending');
    
    if (!updatedData) {
      logger.error('❌ Failed to update calculator checkout status', { calculatorId });
      return false;
    }
    
    // Set current checkout session
    currentCheckoutSession = calculatorId;
    
    logger.info('🔄 Checkout process resumed', { calculatorId });
    
    // Navigate to checkout page
    goto(`/checkout?session=${calculatorId}`);
    
    return true;
  } catch (err) {
    logger.error('❌ Error resuming checkout process', { 
      calculatorId, 
      error: err instanceof Error ? err.message : String(err) 
    });
    return false;
  }
}

/**
 * Complete the checkout process
 * @param calculatorId Calculator session ID
 * @param paymentDetails Payment details (for future implementation)
 * @returns True if successful
 */
export function completeCheckout(calculatorId: string, paymentDetails: any = {}): boolean {
  try {
    paymentProcessing = true;
    paymentError = null;
    
    // Get calculator data
    const calculatorData = calculatorState.getCalculatorData(calculatorId);
    
    if (!calculatorData) {
      logger.error('❌ Calculator data not found for completing checkout', { calculatorId });
      paymentProcessing = false;
      paymentError = 'Calculator data not found';
      return false;
    }
    
    // Simulate payment processing
    logger.info('💳 Processing payment', { calculatorId, amount: calculatorData.totalCost });
    
    // In a real implementation, this would call a payment API
    // For now, we'll just simulate a successful payment
    
    // Update checkout status to completed
    const updatedData = calculatorState.updateCheckoutStatus(calculatorId, 'completed');
    
    if (!updatedData) {
      logger.error('❌ Failed to update calculator checkout status', { calculatorId });
      paymentProcessing = false;
      paymentError = 'Failed to update checkout status';
      return false;
    }
    
    // Clear current checkout session
    currentCheckoutSession = null;
    paymentProcessing = false;
    
    logger.success('✅ Checkout process completed', { calculatorId });
    
    // Navigate to success page or dashboard
    goto(`/family-dashboard?checkout_success=${calculatorId}`);
    
    return true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error('❌ Error completing checkout process', { 
      calculatorId, 
      error: errorMessage
    });
    
    paymentProcessing = false;
    paymentError = errorMessage;
    return false;
  }
}

/**
 * Cancel the current checkout process
 * @param calculatorId Calculator session ID
 * @returns True if successful
 */
export function cancelCheckout(calculatorId: string): boolean {
  try {
    // Get calculator data
    const calculatorData = calculatorState.getCalculatorData(calculatorId);
    
    if (!calculatorData) {
      logger.warning('⚠️ Calculator data not found for canceling checkout', { calculatorId });
      return false;
    }
    
    // Update checkout status back to saved
    const updatedData = calculatorState.updateCheckoutStatus(calculatorId, 'saved');
    
    if (!updatedData) {
      logger.error('❌ Failed to update calculator checkout status', { calculatorId });
      return false;
    }
    
    // Clear current checkout session
    if (currentCheckoutSession === calculatorId) {
      currentCheckoutSession = null;
    }
    
    logger.info('🚫 Checkout process canceled', { calculatorId });
    
    return true;
  } catch (err) {
    logger.error('❌ Error canceling checkout process', { 
      calculatorId, 
      error: err instanceof Error ? err.message : String(err) 
    });
    return false;
  }
}

/**
 * Get the current checkout session
 * @returns Current checkout session ID or null
 */
export function getCurrentCheckoutSession(): string | null {
  return currentCheckoutSession;
}

/**
 * Get all pending checkouts for the current user
 * @returns Array of calculator data with pending checkouts
 */
export function getPendingCheckouts(): CalculatorData[] {
  return calculatorState.getAllCalculatorSessions('pending');
}

/**
 * Get all saved checkouts for the current user
 * @returns Array of calculator data with saved checkouts
 */
export function getSavedCheckouts(): CalculatorData[] {
  return calculatorState.getAllCalculatorSessions('saved');
}

/**
 * Get all completed checkouts for the current user
 * @returns Array of calculator data with completed checkouts
 */
export function getCompletedCheckouts(): CalculatorData[] {
  return calculatorState.getAllCalculatorSessions('completed');
}

/**
 * Get payment processing status
 * @returns True if payment is processing
 */
export function isPaymentProcessing(): boolean {
  return paymentProcessing;
}

/**
 * Get payment error
 * @returns Payment error message or null
 */
export function getPaymentError(): string | null {
  return paymentError;
}

/**
 * Clear payment error
 */
export function clearPaymentError(): void {
  paymentError = null;
}