import type { Actions } from './$types';

const HEADSCALE_API_URL = 'https://hs.groblers.co.uk';
const HEADSCALE_API_KEY = 'ADu3G5f.TC_833KL90ug6ujda1vch8W9ih6_O5Bj';

export const actions = {
	default: async ({ request }) => {
		try {
			const data = await request.formData();
			const email = data.get('email') as string;

			console.log('[AUTH] Login attempt for:', email);

			if (!email) {
				return { error: 'Email required' };
			}

			// Get all users from Headscale
			const usersRes = await fetch(`${HEADSCALE_API_URL}/api/v1/user`, {
				headers: { Authorization: `Bearer ${HEADSCALE_API_KEY}` }
			});
			const usersData = await usersRes.json();
			console.log('[AUTH] Headscale users fetched');

			// Check if user exists
			const user = usersData.users?.find((u: any) => u.email === email);
			if (!user) {
				console.log('[AUTH] User not found:', email);
				return { error: 'User not found' };
			}

			// Get ACL policy
			const aclRes = await fetch(`${HEADSCALE_API_URL}/api/v1/policy`, {
				headers: { Authorization: `Bearer ${HEADSCALE_API_KEY}` }
			});
			const aclResponse = await aclRes.json();
			console.log('[AUTH] ACL policy fetched');

			// Parse the policy string (it's a JSON string, not an object!)
			let aclData: any = {};
			if (aclResponse.policy) {
				aclData = JSON.parse(aclResponse.policy);
			} else {
				aclData = aclResponse;
			}

			// Determine role based on groups
			let role = 'viewer';
			const groups = aclData.groups || {};

			console.log('[AUTH] Groups available:', Object.keys(groups));
			console.log('[AUTH] Checking email:', email);

			for (const [groupName, members] of Object.entries(groups)) {
				if ((members as string[]).includes(email)) {
					console.log('[AUTH] Found in group:', groupName);
					if (groupName === 'group:admin') {
						role = 'admin';
						break;
					} else if (groupName === 'group:manager') {
						role = 'manager';
					}
				}
			}

			console.log('[AUTH] Login success:', email, 'role:', role);

			return {
				success: true,
				user: { email, name: user.name, role },
				apiKey: HEADSCALE_API_KEY
			};
		} catch (error) {
			console.error('[AUTH] Error:', error);
			return { error: 'Authentication failed: ' + (error instanceof Error ? error.message : String(error)) };
		}
	}
} satisfies Actions;
