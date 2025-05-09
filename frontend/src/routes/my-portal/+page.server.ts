import type { PageServerLoad } from './$types';
import { requireUserSession } from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
	const user = await requireUserSession(event);
	return { user };
};
