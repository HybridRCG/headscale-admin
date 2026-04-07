import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface AuthUser {
	email: string;
	name: string;
	role: 'admin' | 'manager' | 'viewer';
}

function createAuthStore() {
	let initialUser: AuthUser | null = null;

	// Load from localStorage on the client
	if (browser) {
		try {
			const email = localStorage.getItem('userEmail');
			const name = localStorage.getItem('userName');
			const role = localStorage.getItem('userRole') as any;

			if (email && name && role) {
				initialUser = { email, name, role };
			}
		} catch (e) {
			console.error('Error loading auth from localStorage:', e);
		}
	}

	const { subscribe, set, update } = writable<AuthUser | null>(initialUser);

	return {
		subscribe,
		login: (user: AuthUser) => {
			if (browser) {
				try {
					localStorage.setItem('userEmail', user.email);
					localStorage.setItem('userName', user.name);
					localStorage.setItem('userRole', user.role);
				} catch (e) {
					console.error('Error saving auth to localStorage:', e);
				}
			}
			set(user);
		},
		logout: () => {
			if (browser) {
				try {
					localStorage.removeItem('userEmail');
					localStorage.removeItem('userName');
					localStorage.removeItem('userRole');
					localStorage.removeItem('apiKey');
					localStorage.removeItem('apiUrl');
				} catch (e) {
					console.error('Error clearing localStorage:', e);
				}
			}
			set(null);
		},
		isLoggedIn: () => {
			let loggedIn = false;
			subscribe((user) => {
				loggedIn = !!user;
			})();
			return loggedIn;
		}
	};
}

export const authStore = createAuthStore();
