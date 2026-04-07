import { writable } from 'svelte/store';

export interface AuthUser {
	email: string;
	name: string;
	role: 'admin' | 'manager' | 'viewer';
}

function createAuthStore() {
	let initialUser: AuthUser | null = null;

	if (typeof window !== 'undefined') {
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
			localStorage.setItem('userEmail', user.email);
			localStorage.setItem('userName', user.name);
			localStorage.setItem('userRole', user.role);
			set(user);
		},
		logout: () => {
			localStorage.removeItem('userEmail');
			localStorage.removeItem('userName');
			localStorage.removeItem('userRole');
			set(null);
		}
	};
}

export const authStore = createAuthStore();
