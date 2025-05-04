/**
 * Locations Mocks
 * 
 * This file provides mock location data for testing.
 */

/**
 * Mock locations data in Strapi API format
 */
export const mockLocations = {
  data: [
    {
      id: '1',
      attributes: {
        name: 'Memorial Chapel',
        address: '123 Main St, Anytown, USA',
        startTime: '14:00',
        duration: 2,
        type: 'funeral_home',
        createdAt: '2025-01-15T10:30:00.000Z',
        updatedAt: '2025-01-15T10:30:00.000Z',
        tribute: {
          data: {
            id: '1',
            attributes: {
              name: 'John Smith Memorial'
            }
          }
        }
      }
    },
    {
      id: '2',
      attributes: {
        name: 'City Chapel',
        address: '456 Oak Ave, Metropolis, USA',
        startTime: '11:00',
        duration: 1,
        type: 'funeral_home',
        createdAt: '2025-02-20T14:45:00.000Z',
        updatedAt: '2025-02-20T14:45:00.000Z',
        tribute: {
          data: {
            id: '2',
            attributes: {
              name: 'Mary Johnson Tribute'
            }
          }
        }
      }
    },
    {
      id: '3',
      attributes: {
        name: 'Garden Memorial',
        address: '789 Pine St, Smallville, USA',
        startTime: '15:30',
        duration: 1,
        type: 'cemetery',
        createdAt: '2025-03-05T09:15:00.000Z',
        updatedAt: '2025-03-05T09:15:00.000Z',
        tribute: {
          data: {
            id: '3',
            attributes: {
              name: 'Robert Williams Memorial'
            }
          }
        }
      }
    },
    {
      id: '4',
      attributes: {
        name: 'Reception Hall',
        address: '101 Elm St, Smallville, USA',
        startTime: '16:30',
        duration: 2,
        type: 'reception',
        createdAt: '2025-03-05T09:15:00.000Z',
        updatedAt: '2025-03-05T09:15:00.000Z',
        tribute: {
          data: {
            id: '3',
            attributes: {
              name: 'Robert Williams Memorial'
            }
          }
        }
      }
    }
  ],
  meta: {
    pagination: {
      page: 1,
      pageSize: 25,
      pageCount: 1,
      total: 4
    }
  }
};

/**
 * Get locations for a specific tribute
 * @param {string} tributeId Tribute ID
 * @returns {Object} Filtered locations
 */
export function getLocationsByTributeId(tributeId) {
  const filteredLocations = mockLocations.data.filter(
    location => location.attributes.tribute.data.id === tributeId
  );
  
  return {
    data: filteredLocations,
    meta: {
      pagination: {
        page: 1,
        pageSize: 25,
        pageCount: 1,
        total: filteredLocations.length
      }
    }
  };
}

/**
 * Get a single location by ID
 * @param {string} id Location ID
 * @returns {Object} Location data
 */
export function getLocationById(id) {
  const location = mockLocations.data.find(loc => loc.id === id);
  
  if (!location) {
    return {
      data: null,
      error: {
        status: 404,
        message: 'Location not found'
      }
    };
  }
  
  return {
    data: location,
    meta: {}
  };
}

/**
 * Create a mock location
 * @param {Object} locationData Location data
 * @returns {Object} Created location
 */
export function createMockLocation(locationData) {
  const newId = `${mockLocations.data.length + 1}`;
  
  const newLocation = {
    id: newId,
    attributes: {
      name: locationData.name || 'New Location',
      address: locationData.address || '123 Test St, Test City, USA',
      startTime: locationData.startTime || '12:00',
      duration: locationData.duration || 1,
      type: locationData.type || 'other',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tribute: locationData.tribute || {
        data: {
          id: '1',
          attributes: {
            name: 'Test Tribute'
          }
        }
      }
    }
  };
  
  return {
    data: newLocation,
    meta: {}
  };
}

/**
 * Update a mock location
 * @param {string} id Location ID
 * @param {Object} locationData Updated location data
 * @returns {Object} Updated location
 */
export function updateMockLocation(id, locationData) {
  const locationIndex = mockLocations.data.findIndex(loc => loc.id === id);
  
  if (locationIndex === -1) {
    return {
      data: null,
      error: {
        status: 404,
        message: 'Location not found'
      }
    };
  }
  
  const updatedLocation = {
    ...mockLocations.data[locationIndex],
    attributes: {
      ...mockLocations.data[locationIndex].attributes,
      ...locationData,
      updatedAt: new Date().toISOString()
    }
  };
  
  return {
    data: updatedLocation,
    meta: {}
  };
}

/**
 * Delete a mock location
 * @param {string} id Location ID
 * @returns {Object} Delete response
 */
export function deleteMockLocation(id) {
  const locationIndex = mockLocations.data.findIndex(loc => loc.id === id);
  
  if (locationIndex === -1) {
    return {
      data: null,
      error: {
        status: 404,
        message: 'Location not found'
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