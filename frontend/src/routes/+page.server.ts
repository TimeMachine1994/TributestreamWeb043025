import type { PageServerLoad } from './$types';

// Simple load function for the home page
export const load: PageServerLoad = async ({ parent }) => {
  console.log("🏠 Loading home page");
  
  // Get authentication status from layout data
  const { authenticated } = await parent();
  
  // Return any additional page-specific data here
  return {
    // We don't need to return authenticated again since it's already in the layout data,
    // but we keep it for backward compatibility
    authenticated
  };
};