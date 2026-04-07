import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface AuthUser {
	email: string;
	name: string;
	role: 'admin' | 'manager' | 'viewer';
}

function createAuthStore() {
	let initialUser: AuthUser | null = null;

	// Only read localStorage on the client
	if (browser) {
		const email = localStorage.getItem('userEmail');
		const name = localStorage.getItem('userName');
		const role = localStorage.getItem('userRole') as any;

		if (email && name && role) {
			initialUser = { email, name, role };
		}
	}

	const { subscribe, set, update } = writable<AuthUser | null>(initialUser);

	return {
		subscribe,
		login: (user: AuthUser) => {
			if (browser) {
				localStorage.setItem('userEmail', user.email);
				localStorage.setItem('userName', user.name);
				localStorage.setItem('userRole', user.role);
			}
			set(user);
		},
		logout: () => {
			if (browser) {
				localStorage.removeItem('userEmail');
				localStorage.removeItem('userName');
				localStorage.removeItem('userRole');
			}
			set(null);
		}
	};
}

export const authStore = createAuthStore();
