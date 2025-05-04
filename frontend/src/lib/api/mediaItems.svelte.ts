/**
 * Media Items API Module - Svelte 5 Runes Implementation
 * 
 * This module provides functionality to interact with tribute media items
 * using Svelte 5 runes for state management.
 */

import { getStrapiUrl } from '$lib/config';
import { createLogger } from '$lib/logger';

// Create a dedicated logger
const logger = createLogger('MediaItemsAPI');

/**
 * MediaItem interface
 */
export interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: string; // image, video, document
  thumbnailUrl?: string;
  tributeId?: string;
  [key: string]: any;
}

// State for API operations
export const mediaState = $state<{
  loading: boolean;
  uploadProgress: number;
  error: string | null;
  mediaItems: MediaItem[];
}>({
  loading: false,
  uploadProgress: 0,
  error: null,
  mediaItems: []
});

// Getter functions for state
export function getLoading(): boolean {
  return mediaState.loading;
}

export function getUploadProgress(): number {
  return mediaState.uploadProgress;
}

export function getError(): string | null {
  return mediaState.error;
}

export function getMediaItems(): MediaItem[] {
  return mediaState.mediaItems;
}

// Derived value getter functions
export function getMediaCount(): number {
  return mediaState.mediaItems.length;
}

export function getHasMedia(): boolean {
  return getMediaCount() > 0;
}

export function getIsUploading(): boolean {
  return mediaState.loading && mediaState.uploadProgress > 0 && mediaState.uploadProgress < 100;
}

/**
 * Fetch media items for a tribute
 * @param tributeId Tribute ID
 * @param token JWT authentication token
 * @returns Media items or null on error
 */
export async function fetchMediaItems(tributeId: string, token: string): Promise<MediaItem[] | null> {
  mediaState.loading = true;
  mediaState.error = null;
  
  try {
    logger.info("🔍 Fetching media items for tribute", { tributeId });
    const response = await fetch(`${getStrapiUrl()}/api/tributes/${tributeId}?populate=mediaItems`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Extract media items from the response
    const tributeMediaItems = result.data?.attributes?.mediaItems || [];
    
    // Transform API response to expected format
    const transformedMediaItems = tributeMediaItems.map((item: any) => ({
      id: item.id,
      name: item.name,
      url: item.url,
      type: item.type,
      thumbnailUrl: item.thumbnailUrl,
      tributeId: tributeId
    }));
    
    // Update state
    mediaState.mediaItems = transformedMediaItems;
    logger.success(`✅ Retrieved ${mediaState.mediaItems.length} media items for tribute ${tributeId}`);
    
    return mediaState.mediaItems;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("❌ Error fetching media items", { tributeId, error: errorMessage });
    mediaState.error = errorMessage;
    return null;
  } finally {
    mediaState.loading = false;
  }
}

/**
 * Upload a new media item for a tribute
 * @param tributeId Tribute ID
 * @param file File to upload
 * @param token JWT authentication token
 * @returns Created media item or null on error
 */
export async function uploadMedia(
  tributeId: string,
  file: File,
  token: string
): Promise<MediaItem | null> {
  mediaState.loading = true;
  mediaState.uploadProgress = 0;
  mediaState.error = null;
  
  try {
    logger.info("📤 Uploading media for tribute", { tributeId, fileName: file.name, fileSize: file.size });
    
    // Create form data
    const formData = new FormData();
    formData.append('files', file);
    formData.append('ref', 'api::tribute.tribute');
    formData.append('refId', tributeId);
    formData.append('field', 'mediaItems');
    
    // Create XMLHttpRequest to track upload progress
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          mediaState.uploadProgress = Math.round((event.loaded / event.total) * 100);
          logger.debug(`📊 Upload progress: ${mediaState.uploadProgress}%`);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            
            // Transform API response
            const newMediaItem: MediaItem = {
              id: response[0].id,
              name: response[0].name,
              url: response[0].url,
              type: getMediaType(file.type),
              thumbnailUrl: response[0].formats?.thumbnail?.url || '',
              tributeId: tributeId
            };
            
            // Update local state
            mediaState.mediaItems = [...mediaState.mediaItems, newMediaItem];
            
            logger.success("✅ Media uploaded successfully", { id: newMediaItem.id });
            mediaState.loading = false;
            mediaState.uploadProgress = 100;
            resolve(newMediaItem);
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error("❌ Error parsing upload response", { error: errorMessage });
            mediaState.error = "Failed to process upload response";
            mediaState.loading = false;
            mediaState.uploadProgress = 0;
            reject(mediaState.error);
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            const errorMessage = errorData.error?.message || `Upload failed with status ${xhr.status}`;
            logger.error("❌ Upload failed", { status: xhr.status, error: errorMessage });
            mediaState.error = errorMessage;
            mediaState.loading = false;
            mediaState.uploadProgress = 0;
            reject(mediaState.error);
          } catch (err) {
            mediaState.error = `Upload failed with status ${xhr.status}`;
            mediaState.loading = false;
            mediaState.uploadProgress = 0;
            reject(mediaState.error);
          }
        }
      });
      
      xhr.addEventListener('error', () => {
        logger.error("❌ Upload network error");
        mediaState.error = "Network error during upload";
        mediaState.loading = false;
        mediaState.uploadProgress = 0;
        reject(mediaState.error);
      });
      
      xhr.addEventListener('abort', () => {
        logger.warning("⚠️ Upload aborted");
        mediaState.error = "Upload was aborted";
        mediaState.loading = false;
        mediaState.uploadProgress = 0;
        reject(mediaState.error);
      });
      
      xhr.open('POST', `${getStrapiUrl()}/api/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("❌ Error uploading media", { tributeId, error: errorMessage });
    mediaState.error = errorMessage;
    mediaState.loading = false;
    mediaState.uploadProgress = 0;
    return null;
  }
}

/**
 * Delete a media item
 * @param mediaId Media item ID to delete
 * @param token JWT authentication token
 * @returns Success status
 */
export async function deleteMedia(mediaId: string, token: string): Promise<boolean> {
  mediaState.loading = true;
  mediaState.error = null;
  
  try {
    logger.info("🗑️ Deleting media item", { mediaId });
    
    const response = await fetch(`${getStrapiUrl()}/api/upload/files/${mediaId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }
    
    // Update local state - remove the media item from the array
    mediaState.mediaItems = mediaState.mediaItems.filter(item => item.id !== mediaId);
    
    logger.success("✅ Media item deleted successfully", { id: mediaId });
    return true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("❌ Error deleting media item", { mediaId, error: errorMessage });
    mediaState.error = errorMessage;
    return false;
  } finally {
    mediaState.loading = false;
  }
}

/**
 * Update media item metadata
 * @param mediaId Media item ID
 * @param updates Object with fields to update
 * @param token JWT authentication token
 * @returns Updated media item or null on error
 */
export async function updateMediaMetadata(
  mediaId: string,
  updates: { name?: string; alternativeText?: string; caption?: string },
  token: string
): Promise<MediaItem | null> {
  mediaState.loading = true;
  mediaState.error = null;
  
  try {
    logger.info("🔄 Updating media metadata", { mediaId, updates });
    
    const response = await fetch(`${getStrapiUrl()}/api/upload/files/${mediaId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Transform API response
    const updatedMediaItem: MediaItem = {
      id: result.id,
      name: result.name,
      url: result.url,
      type: getMediaType(result.mime),
      thumbnailUrl: result.formats?.thumbnail?.url || '',
      tributeId: mediaState.mediaItems.find(item => item.id === mediaId)?.tributeId
    };
    
    // Update local state - replace the media item in the array
    mediaState.mediaItems = mediaState.mediaItems.map(item =>
      item.id === mediaId ? updatedMediaItem : item
    );
    
    logger.success("✅ Media metadata updated successfully", { id: mediaId });
    return updatedMediaItem;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("❌ Error updating media metadata", { mediaId, error: errorMessage });
    mediaState.error = errorMessage;
    return null;
  } finally {
    mediaState.loading = false;
  }
}

/**
 * Determine media type from MIME type
 * @param mimeType MIME type string
 * @returns Media type (image, video, document)
 */
function getMediaType(mimeType: string): string {
  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (mimeType.startsWith('video/')) {
    return 'video';
  } else if (
    mimeType.startsWith('application/pdf') ||
    mimeType.startsWith('application/msword') ||
    mimeType.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml') ||
    mimeType.startsWith('text/')
  ) {
    return 'document';
  } else {
    return 'other';
  }
}

/**
 * Clear the media items state
 * Useful when changing tributes or logging out
 */
export function clearMediaItems(): void {
  mediaState.mediaItems = [];
  mediaState.error = null;
  mediaState.loading = false;
  mediaState.uploadProgress = 0;
}