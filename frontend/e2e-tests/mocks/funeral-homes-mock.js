/**
 * Funeral Homes Mocks
 * 
 * This file provides mock funeral home data for testing.
 */

/**
 * Mock funeral homes data
 */
export const mockFuneralHomes = {
  data: [
    {
      id: 1,
      attributes: {
        name: 'Peaceful Rest Funeral Home',
        address: '123 Main Street',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        phoneNumber: '555-123-4567',
        createdAt: '2025-01-15T10:00:00.000Z',
        updatedAt: '2025-01-15T10:00:00.000Z'
      }
    },
    {
      id: 2,
      attributes: {
        name: 'Serene Memorial Chapel',
        address: '456 Oak Avenue',
        city: 'Riverdale',
        state: 'NY',
        zipCode: '10471',
        phoneNumber: '555-987-6543',
        createdAt: '2025-01-20T14:30:00.000Z',
        updatedAt: '2025-01-20T14:30:00.000Z'
      }
    },
    {
      id: 3,
      attributes: {
        name: 'Eternal Peace Funeral Services',
        address: '789 Elm Street',
        city: 'Lakeside',
        state: 'CA',
        zipCode: '92040',
        phoneNumber: '555-456-7890',
        createdAt: '2025-02-05T09:15:00.000Z',
        updatedAt: '2025-02-05T09:15:00.000Z'
      }
    },
    {
      id: 4,
      attributes: {
        name: 'Dignity Memorial Center',
        address: '321 Pine Road',
        city: 'Mountainview',
        state: 'CO',
        zipCode: '80301',
        phoneNumber: '555-222-3333',
        createdAt: '2025-02-10T11:45:00.000Z',
        updatedAt: '2025-02-10T11:45:00.000Z'
      }
    },
    {
      id: 5,
      attributes: {
        name: 'Graceful Passages Funeral Home',
        address: '555 Willow Lane',
        city: 'Riverside',
        state: 'TX',
        zipCode: '75001',
        phoneNumber: '555-888-9999',
        createdAt: '2025-03-01T16:20:00.000Z',
        updatedAt: '2025-03-01T16:20:00.000Z'
      }
    }
  ],
  meta: {
    pagination: {
      page: 1,
      pageSize: 25,
      pageCount: 1,
      total: 5
    }
  }
};

/**
 * Mock function to search funeral homes
 * @param {string} query Search query
 * @returns {Array} Filtered funeral homes
 */
export function searchFuneralHomes(query) {
  if (!query) return [];
  
  const normalizedQuery = query.toLowerCase();
  
  return mockFuneralHomes.data
    .filter(home => 
      home.attributes.name.toLowerCase().includes(normalizedQuery) ||
      home.attributes.city.toLowerCase().includes(normalizedQuery) ||
      home.attributes.state.toLowerCase().includes(normalizedQuery)
    )
    .map(home => ({
      id: home.id,
      name: home.attributes.name,
      address: home.attributes.address,
      city: home.attributes.city,
      state: home.attributes.state,
      zipCode: home.attributes.zipCode,
      phoneNumber: home.attributes.phoneNumber
    }));
}

/**
 * Mock function to create a new funeral home
 * @param {Object} data Funeral home data
 * @returns {Object} Created funeral home
 */
export function createFuneralHome(data) {
  const newId = mockFuneralHomes.data.length + 1;
  
  const newFuneralHome = {
    id: newId,
    attributes: {
      name: data.name,
      address: data.address,
      city: data.city || null,
      state: data.state || null,
      zipCode: data.zipCode || null,
      phoneNumber: data.phoneNumber || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };
  
  return {
    data: {
      id: newId,
      attributes: newFuneralHome.attributes
    }
  };
}