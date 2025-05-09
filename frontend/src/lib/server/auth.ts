import { redirect, type RequestEvent } from '@sveltejs/kit';

/**
 * Ensures the user is authenticated.
 * Redirects to /login if JWT is missing or invalid.
 * Returns the user object if authenticated.
 */
export async function requireUserSession(event: RequestEvent): Promise<any> {
	const jwt = event.cookies.get('jwt');

	if (!jwt) {
		throw redirect(302, '/login');
	}

	const res = await event.fetch('/api/auth/session');

	if (!res.ok) {
		throw redirect(302, '/login');
	}

	const { user } = await res.json();

	if (!user) {
		throw redirect(302, '/login');
	}

	return user;
}
