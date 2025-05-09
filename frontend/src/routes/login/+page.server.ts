import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString() ?? '';
		const password = data.get('password')?.toString() ?? '';

		if (!email || !password) {
			return fail(400, {
				email: email ? undefined : 'Email is required',
				password: password ? undefined : 'Password is required',
				message: 'Missing fields'
			});
		}

		// Example hardcoded user for demonstration
		if (email === 'admin@example.com' && password === 'password123') {

            
			// Replace with JWT/session logic
			cookies.set('session', 'mock-session-token', {
				path: '/',
				httpOnly: true,
				maxAge: 60 * 60 * 24
			});

			throw redirect(302, '/dashboard');
		}

		return fail(401, {
			message: 'Invalid email or password'
		});
	}
};
