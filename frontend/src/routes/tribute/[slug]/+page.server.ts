import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getStrapiUrl } from '$lib/config';

// Get the Strapi URL from config
const STRAPI_URL = getStrapiUrl();

export const load: PageServerLoad = async ({ params, fetch, cookies }) => {
  console.log("📄 Loading tribute page for slug:", params.slug);
  
  // Get JWT token from cookies
  const jwt = cookies.get('jwt');
  
  try {
    // Build query parameters for Strapi
    const queryParams = new URLSearchParams({
      'filters[slug][$eq]': params.slug,
      'populate': '*'  // Populate all relations
    });
    
    // Fetch tribute from Strapi
    const response = await fetch(`${STRAPI_URL}/api/tributes?${queryParams.toString()}`, {
      headers: jwt ? {
        'Authorization': `Bearer ${jwt}`
      } : undefined
    });
    
    if (!response.ok) {
      console.error("❌ Failed to fetch tribute:", response.status, response.statusText);
      throw error(response.status, 'Failed to load tribute');
    }
    
    const result = await response.json();
    
    // Check if tribute exists
    if (!result.data || result.data.length === 0) {
      console.error("❌ Tribute not found for slug:", params.slug);
      throw error(404, 'Tribute not found');
    }
    
    const tribute = result.data[0];
    console.log("✅ Tribute loaded successfully:", tribute.attributes?.name || tribute.name);
    
    return {
      tribute
    };
  } catch (err) {
    console.error("💥 Error loading tribute:", err);
    throw error(500, 'Error loading tribute');
  }
};