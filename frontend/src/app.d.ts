// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: {
				id: number;
				username: string;
				email: string;
				role: {
					id: number;
					name: string;
					type: string;
				};
			};
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// Svelte 5 Runes Type Definitions
	interface Snippet<Args extends any[] = []> {
		(...args: Args): any;
	}

	// Add global type definitions for runes
	interface Window {
		// Add any global window properties needed for runes
	}
}

export {};
