interface Locals {
	user: {
		id: number;
		username: string;
		email: string;
		// add more fields from Strapi's /users/me
	} | null;
}
