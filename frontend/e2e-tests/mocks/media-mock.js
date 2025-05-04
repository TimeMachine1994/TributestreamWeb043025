/**
 * Media Items Mocks
 * 
 * This file provides mock media item data for testing.
 */

/**
 * Mock media items data in Strapi API format
 */
export const mockMediaItems = {
  data: [
    {
      id: '1',
      attributes: {
        name: 'Memorial Photo 1',
        description: 'Family photo from the memorial service',
        type: 'image',
        url: 'https://example.com/media/memorial-photo-1.jpg',
        thumbnailUrl: 'https://example.com/media/thumbnails/memorial-photo-1.jpg',
        size: 1024000,
        mimeType: 'image/jpeg',
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
        name: 'Memorial Video',
        description: 'Video recording of the memorial service',
        type: 'video',
        url: 'https://example.com/media/memorial-video.mp4',
        thumbnailUrl: 'https://example.com/media/thumbnails/memorial-video.jpg',
        size: 256000000,
        mimeType: 'video/mp4',
        duration: 3600,
        createdAt: '2025-01-16T14:45:00.000Z',
        updatedAt: '2025-01-16T14:45:00.000Z',
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
      id: '3',
      attributes: {
        name: 'Tribute Photo',
        description: 'Portrait photo for the tribute page',
        type: 'image',
        url: 'https://example.com/media/tribute-photo.jpg',
        thumbnailUrl: 'https://example.com/media/thumbnails/tribute-photo.jpg',
        size: 2048000,
        mimeType: 'image/jpeg',
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
      id: '4',
      attributes: {
        name: 'Memorial Audio',
        description: 'Audio recording of the eulogy',
        type: 'audio',
        url: 'https://example.com/media/eulogy-audio.mp3',
        thumbnailUrl: 'https://example.com/media/thumbnails/audio-icon.jpg',
        size: 15000000,
        mimeType: 'audio/mpeg',
        duration: 900,
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
      id: '5',
      attributes: {
        name: 'Photo Collage',
        description: 'Collection of family photos',
        type: 'image',
        url: 'https://example.com/media/photo-collage.jpg',
        thumbnailUrl: 'https://example.com/media/thumbnails/photo-collage.jpg',
        size: 3072000,
        mimeType: 'image/jpeg',
        createdAt: '2025-03-06T11:30:00.000Z',
        updatedAt: '2025-03-06T11:30:00.000Z',
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
      total: 5
    }
  }
};

/**
 * Get media items for a specific tribute
 * @param {string} tributeId Tribute ID
 * @returns {Object} Filtered media items
 */
export function getMediaItemsByTributeId(tributeId) {
  const filteredItems = mockMediaItems.data.filter(
    item => item.attributes.tribute.data.id === tributeId
  );
  
  return {
    data: filteredItems,
    meta: {
      pagination: {
        page: 1,
        pageSize: 25,
        pageCount: 1,
        total: filteredItems.length
      }
    }
  };
}

/**
 * Get a single media item by ID
 * @param {string} id Media item ID
 * @returns {Object} Media item data
 */
export function getMediaItemById(id) {
  const item = mockMediaItems.data.find(mediaItem => mediaItem.id === id);
  
  if (!item) {
    return {
      data: null,
      error: {
        status: 404,
        message: 'Media item not found'
      }
    };
  }
  
  return {
    data: item,
    meta: {}
  };
}

/**
 * Create a mock media item
 * @param {Object} mediaData Media item data
 * @returns {Object} Created media item
 */
export function createMockMediaItem(mediaData) {
  const newId = `${mockMediaItems.data.length + 1}`;
  
  const newMediaItem = {
    id: newId,
    attributes: {
      name: mediaData.name || 'New Media Item',
      description: mediaData.description || '',
      type: mediaData.type || 'image',
      url: mediaData.url || `https://example.com/media/new-item-${newId}.jpg`,
      thumbnailUrl: mediaData.thumbnailUrl || `https://example.com/media/thumbnails/new-item-${newId}.jpg`,
      size: mediaData.size || 1024000,
      mimeType: mediaData.mimeType || 'image/jpeg',
      duration: mediaData.duration,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tribute: mediaData.tribute || {
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
    data: newMediaItem,
    meta: {}
  };
}

/**
 * Update a mock media item
 * @param {string} id Media item ID
 * @param {Object} mediaData Updated media item data
 * @returns {Object} Updated media item
 */
export function updateMockMediaItem(id, mediaData) {
  const mediaIndex = mockMediaItems.data.findIndex(item => item.id === id);
  
  if (mediaIndex === -1) {
    return {
      data: null,
      error: {
        status: 404,
        message: 'Media item not found'
      }
    };
  }
  
  const updatedMediaItem = {
    ...mockMediaItems.data[mediaIndex],
    attributes: {
      ...mockMediaItems.data[mediaIndex].attributes,
      ...mediaData,
      updatedAt: new Date().toISOString()
    }
  };
  
  return {
    data: updatedMediaItem,
    meta: {}
  };
}

/**
 * Delete a mock media item
 * @param {string} id Media item ID
 * @returns {Object} Delete response
 */
export function deleteMockMediaItem(id) {
  const mediaIndex = mockMediaItems.data.findIndex(item => item.id === id);
  
  if (mediaIndex === -1) {
    return {
      data: null,
      error: {
        status: 404,
        message: 'Media item not found'
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