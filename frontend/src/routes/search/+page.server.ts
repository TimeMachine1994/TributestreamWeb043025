import type { PageServerLoad } from './$types';
import { getStrapiUrl } from '$lib/config';

// Get the Strapi URL from config
const STRAPI_URL = getStrapiUrl();

export const load: PageServerLoad = async ({ url, fetch, cookies }) => {
  console.log("🔍 Loading search page");
  
  // Get search term from URL
  const searchTerm = url.searchParams.get('name') || '';
  console.log(`🔍 Search term: "${searchTerm}"`);
  
  // Get JWT token from cookies
  const jwt = cookies.get('jwt');
  
  // Initialize tributes array
  let tributes: any[] = [];
  
  // If search term is provided, fetch tributes
  if (searchTerm && searchTerm.trim()) {
    try {
      console.log("🔍 Searching for tributes matching:", searchTerm);
      
      // Build query parameters for Strapi
      const queryParams = new URLSearchParams({
        'filters[name][$containsi]': searchTerm,
      });
      
      // Fetch tributes from Strapi
      const response = await fetch(`${STRAPI_URL}/api/tributes?${queryParams.toString()}`, {
        headers: jwt ? {
          'Authorization': `Bearer ${jwt}`
        } : undefined
      });
      
      if (response.ok) {
        const result = await response.json();
        tributes = result.data || [];
        
        console.log(`✅ Found ${tributes.length} tributes matching "${searchTerm}"`);
      } else {
        console.error("❌ Failed to fetch tributes:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("💥 Error searching for tributes:", error);
    }
  }
  
  // Return search results and search term
  return {
    tributes,
    searchTerm
  };
};