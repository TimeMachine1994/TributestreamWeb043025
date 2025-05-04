/**
 * Tributes Mocks
 * 
 * This file provides mock tribute data for testing.
 */

/**
 * Mock tributes data in Strapi API format
 */
export const mockTributes = {
  data: [
    {
      id: '1',
      attributes: {
        name: 'John Smith Memorial',
        slug: 'john-smith-memorial',
        createdAt: '2025-01-15T10:30:00.000Z',
        updatedAt: '2025-01-15T10:30:00.000Z',
        liveStreamDate: '2025-06-15T00:00:00.000Z',
        liveStreamStartTime: '14:00',
        liveStreamDuration: 2,
        packageId: 'legacy',
        packageInfo: {
          id: 'legacy',
          name: 'Legacy Package',
          price: 799
        },
        locations: [
          {
            name: 'Memorial Chapel',
            address: '123 Main St, Anytown, USA',
            startTime: '14:00',
            duration: 2
          }
        ],
        isPaymentComplete: true
      }
    },
    {
      id: '2',
      attributes: {
        name: 'Mary Johnson Tribute',
        slug: 'mary-johnson-tribute',
        createdAt: '2025-02-20T14:45:00.000Z',
        updatedAt: '2025-02-20T14:45:00.000Z',
        liveStreamDate: '2025-07-10T00:00:00.000Z',
        liveStreamStartTime: '11:00',
        liveStreamDuration: 1,
        packageId: 'anywhere',
        packageInfo: {
          id: 'anywhere',
          name: 'Anywhere Package',
          price: 499
        },
        locations: [
          {
            name: 'City Chapel',
            address: '456 Oak Ave, Metropolis, USA',
            startTime: '11:00',
            duration: 1
          }
        ],
        isPaymentComplete: false
      }
    },
    {
      id: '3',
      attributes: {
        name: 'Robert Williams Memorial',
        slug: 'robert-williams-memorial',
        createdAt: '2025-03-05T09:15:00.000Z',
        updatedAt: '2025-03-05T09:15:00.000Z',
        liveStreamDate: '2025-08-20T00:00:00.000Z',
        liveStreamStartTime: '15:30',
        liveStreamDuration: 3,
        packageId: 'solo',
        packageInfo: {
          id: 'solo',
          name: 'Solo Package',
          price: 399
        },
        locations: [
          {
            name: 'Garden Memorial',
            address: '789 Pine St, Smallville, USA',
            startTime: '15:30',
            duration: 1
          },
          {
            name: 'Reception Hall',
            address: '101 Elm St, Smallville, USA',
            startTime: '16:30',
            duration: 2
          }
        ],
        isPaymentComplete: true
      }
    }
  ],
  meta: {
    pagination: {
      page: 1,
      pageSize: 25,
      pageCount: 1,
      total: 3
    }
  }
};

/**
 * Get a single mock tribute by ID
 * @param {string} id Tribute ID
 * @returns {Object} Mock tribute data
 */
export function getMockTributeById(id) {
  const tribute = mockTributes.data.find(t => t.id === id);
  
  if (!tribute) {
    return {
      data: null,
      error: {
        status: 404,
        message: 'Tribute not found'
      }
    };
  }
  
  return {
    data: tribute,
    meta: {}
  };
}

/**
 * Create a mock tribute response
 * @param {Object} tributeData Tribute data to create
 * @returns {Object} Created tribute response
 */
export function createMockTribute(tributeData) {
  const newId = `${mockTributes.data.length + 1}`;
  
  const newTribute = {
    id: newId,
    attributes: {
      name: tributeData.name || 'New Tribute',
      slug: tributeData.slug || tributeData.name.toLowerCase().replace(/\s+/g, '-') || 'new-tribute',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...tributeData
    }
  };
  
  return {
    data: newTribute,
    meta: {}
  };
}

/**
 * Update a mock tribute
 * @param {string} id Tribute ID to update
 * @param {Object} tributeData Updated tribute data
 * @returns {Object} Updated tribute response
 */
export function updateMockTribute(id, tributeData) {
  const tributeIndex = mockTributes.data.findIndex(t => t.id === id);
  
  if (tributeIndex === -1) {
    return {
      data: null,
      error: {
        status: 404,
        message: 'Tribute not found'
      }
    };
  }
  
  const updatedTribute = {
    ...mockTributes.data[tributeIndex],
    attributes: {
      ...mockTributes.data[tributeIndex].attributes,
      ...tributeData,
      updatedAt: new Date().toISOString()
    }
  };
  
  return {
    data: updatedTribute,
    meta: {}
  };
}

/**
 * Delete a mock tribute
 * @param {string} id Tribute ID to delete
 * @returns {Object} Delete response
 */
export function deleteMockTribute(id) {
  const tributeIndex = mockTributes.data.findIndex(t => t.id === id);
  
  if (tributeIndex === -1) {
    return {
      data: null,
      error: {
        status: 404,
        message: 'Tribute not found'
      }
    };
  }
  
  return {
    data: {
      id,
      attributes: {
        deleted: true
      }
    },
    meta: {}
  };
}