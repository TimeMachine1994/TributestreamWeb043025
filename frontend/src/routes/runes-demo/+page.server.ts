import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Check if user is authenticated
  if (!locals.user) {
    console.log('🔒 User not authenticated, redirecting to login');
    // Redirect to login page with return URL
    throw redirect(302, '/login?returnTo=/runes-demo');
  }

  // Return user data to the page
  return {
    user: locals.user
  };
};