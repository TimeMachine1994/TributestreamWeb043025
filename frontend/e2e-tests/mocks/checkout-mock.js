/**
 * Checkout Mocks
 * 
 * This file provides mock checkout session data for testing.
 */

/**
 * Mock checkout sessions for localStorage
 */
export const mockCheckoutSessions = {
  'cache:calculator:test-user-123:session:checkout-pending-123': {
    value: {
      id: 'checkout-pending-123',
      customerName: 'John Doe',
      email: 'john.doe@example.com',
      phoneNumber: '555-123-4567',
      livestreamDate: '2025-06-15',
      livestreamTime: '14:00',
      livestreamLocation: 'Memorial Chapel',
      livestreamAtFuneralHome: true,
      selectedPackage: 'Solo Package',
      livestreamDuration: 2,
      locations: [
        {
          name: 'Primary Location',
          address: 'Memorial Chapel, 123 Main St',
          startTime: '14:00',
          duration: 2
        }
      ],
      urlFriendlyText: 'john-doe-memorial',
      totalCost: 449,
      savedAt: Date.now() - 3600000, // 1 hour ago
      checkoutStatus: 'pending'
    },
    timestamp: Date.now() - 3600000,
    ttl: 7 * 24 * 60 * 60 * 1000 // 7 days
  },
  
  'cache:calculator:test-user-123:session:checkout-saved-456': {
    value: {
      id: 'checkout-saved-456',
      customerName: 'Jane Smith',
      email: 'jane.smith@example.com',
      phoneNumber: '555-987-6543',
      livestreamDate: '2025-07-20',
      livestreamTime: '10:00',
      livestreamLocation: 'City Chapel',
      livestreamAtFuneralHome: true,
      selectedPackage: 'Anywhere Package',
      livestreamDuration: 1,
      locations: [
        {
          name: 'Primary Location',
          address: 'City Chapel, 456 Oak Ave',
          startTime: '10:00',
          duration: 1
        }
      ],
      urlFriendlyText: 'jane-smith-tribute',
      totalCost: 499,
      savedAt: Date.now() - 86400000, // 1 day ago
      checkoutStatus: 'saved'
    },
    timestamp: Date.now() - 86400000,
    ttl: 7 * 24 * 60 * 60 * 1000 // 7 days
  },
  
  'cache:calculator:test-user-123:session:checkout-completed-789': {
    value: {
      id: 'checkout-completed-789',
      customerName: 'Robert Johnson',
      email: 'robert@example.com',
      phoneNumber: '555-111-2222',
      livestreamDate: '2025-08-10',
      livestreamTime: '15:00',
      livestreamLocation: 'Memorial Gardens',
      livestreamAtFuneralHome: true,
      selectedPackage: 'Legacy Package',
      livestreamDuration: 3,
      locations: [
        {
          name: 'Primary Location',
          address: 'Memorial Gardens, 789 Pine St',
          startTime: '15:00',
          duration: 3
        }
      ],
      urlFriendlyText: 'robert-johnson-memorial',
      totalCost: 899,
      savedAt: Date.now() - 172800000, // 2 days ago
      checkoutStatus: 'completed',
      paymentDetails: {
        billingName: 'Robert Johnson',
        billingAddress: '123 Main St, Anytown, USA',
        cardLast4: '1111'
      }
    },
    timestamp: Date.now() - 172800000,
    ttl: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};

/**
 * Mock payment processing response
 * @param {Object} paymentData Payment data
 * @returns {Object} Payment processing response
 */
export function mockProcessPayment(paymentData) {
  // Simulate payment processing
  const isValid = 
    paymentData.cardNumber && 
    paymentData.cardExpiry && 
    paymentData.cardCvv &&
    paymentData.billingFirstName &&
    paymentData.billingLastName &&
    paymentData.billingAddress;
  
  if (!isValid) {
    return {
      success: false,
      error: 'Invalid payment information'
    };
  }
  
  // Simulate card validation
  if (paymentData.cardNumber === '4111111111111111') {
    return {
      success: true,
      message: 'Payment processed successfully',
      transactionId: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      paymentDetails: {
        billingName: `${paymentData.billingFirstName} ${paymentData.billingLastName}`,
        billingAddress: paymentData.billingAddress,
        cardLast4: paymentData.cardNumber.slice(-4)
      }
    };
  } else {
    return {
      success: false,
      error: 'Invalid card number'
    };
  }
}

/**
 * Get mock checkout session by ID
 * @param {string} sessionId Checkout session ID
 * @returns {Object|null} Checkout session data or null if not found
 */
export function getMockCheckoutSession(sessionId) {
  const key = `cache:calculator:test-user-123:session:${sessionId}`;
  const session = mockCheckoutSessions[key];
  
  if (!session) {
    return null;
  }
  
  return session.value;
}

/**
 * Get all mock checkout sessions by status
 * @param {string} status Checkout status ('pending', 'saved', 'completed')
 * @returns {Array} Array of checkout sessions
 */
export function getMockCheckoutSessionsByStatus(status) {
  return Object.values(mockCheckoutSessions)
    .filter(session => session.value.checkoutStatus === status)
    .map(session => session.value);
}

/**
 * Update mock checkout session status
 * @param {string} sessionId Checkout session ID
 * @param {string} status New status
 * @returns {Object|null} Updated checkout session or null if not found
 */
export function updateMockCheckoutSessionStatus(sessionId, status) {
  const key = `cache:calculator:test-user-123:session:${sessionId}`;
  const session = mockCheckoutSessions[key];
  
  if (!session) {
    return null;
  }
  
  const updatedSession = {
    ...session,
    value: {
      ...session.value,
      checkoutStatus: status,
      savedAt: Date.now()
    },
    timestamp: Date.now()
  };
  
  mockCheckoutSessions[key] = updatedSession;
  
  return updatedSession.value;
}

/**
 * Complete mock checkout session
 * @param {string} sessionId Checkout session ID
 * @param {Object} paymentDetails Payment details
 * @returns {Object|null} Updated checkout session or null if not found
 */
export function completeMockCheckoutSession(sessionId, paymentDetails) {
  const key = `cache:calculator:test-user-123:session:${sessionId}`;
  const session = mockCheckoutSessions[key];
  
  if (!session) {
    return null;
  }
  
  const updatedSession = {
    ...session,
    value: {
      ...session.value,
      checkoutStatus: 'completed',
      savedAt: Date.now(),
      paymentDetails
    },
    timestamp: Date.now()
  };
  
  mockCheckoutSessions[key] = updatedSession;
  
  return updatedSession.value;
}