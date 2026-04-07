import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

const HEADSCALE_API_URL = process.env.HEADSCALE_API_URL || 'https://hs.groblers.co.uk';
const HEADSCALE_API_KEY = process.env.HEADSCALE_API_KEY || 'ADu3G5f.TC_833KL90ug6ujda1vch8W9ih6_O5Bj';

export const POST: RequestHandler = async ({ request }) => {
	const { email } = await request.json();

	if (!email) {
		return json({ error: 'Email required' }, { status: 400 });
	}

	try {
		// Get all users from Headscale
		const usersRes = await fetch(`${HEADSCALE_API_URL}/api/v1/user`, {
			headers: { Authorization: `Bearer ${HEADSCALE_API_KEY}` }
		});
		const usersData = await usersRes.json();

		// Check if user exists
		const user = usersData.users?.find((u: any) => u.email === email);
		if (!user) {
			return json({ error: 'User not found' }, { status: 401 });
		}

		// Get ACL policy
		const aclRes = await fetch(`${HEADSCALE_API_URL}/api/v1/policy`, {
			headers: { Authorization: `Bearer ${HEADSCALE_API_KEY}` }
		});
		const aclData = await aclRes.json();

		// Determine role based on groups
		let role = 'viewer'; // default
		const groups = aclData.groups || {};

		for (const [groupName, members] of Object.entries(groups)) {
			if ((members as string[]).includes(email)) {
				if (groupName === 'group:admin') {
					role = 'admin';
					break;
				} else if (groupName === 'group:manager') {
					role = 'manager';
				}
			}
		}

		// Create session token (stored in httpOnly cookie by frontend)
		const sessionToken = Buffer.from(JSON.stringify({
			email,
			userId: user.id,
			name: user.name,
			role,
			timestamp: Date.now()
		})).toString('base64');

		return json({
			success: true,
			user: { email, name: user.name, role },
			sessionToken
		});
	} catch (error) {
		console.error('Auth error:', error);
		return json({ error: 'Authentication failed' }, { status: 500 });
	}
};
