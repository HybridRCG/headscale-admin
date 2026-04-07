<script lang="ts">
	import { goto } from '$app/navigation';
	let email = '';
	let loading = false;
	let error = '';

	async function handleLogin() {
		loading = true;
		error = '';

		try {
			const response = await fetch('/admin/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});

			const data = await response.json();

			if (!response.ok) {
				error = data.error || 'Login failed';
				loading = false;
				return;
			}

			// Store session token in localStorage
			localStorage.setItem('sessionToken', data.sessionToken);
			localStorage.setItem('userRole', data.user.role);
			localStorage.setItem('userName', data.user.name);

			// Redirect to admin dashboard
			await goto('/');
		} catch (err) {
			error = 'Connection error';
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
	<div class="w-full max-w-md">
		<div class="bg-white rounded-lg shadow-xl p-8">
			<h1 class="text-3xl font-bold text-center mb-2 text-slate-900">Headscale Admin</h1>
			<p class="text-center text-slate-600 mb-8">Authentication Required</p>

			<form on:submit|preventDefault={handleLogin} class="space-y-6">
				<div>
					<label for="email" class="block text-sm font-medium text-slate-700 mb-2">
						Email Address
					</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						placeholder="your@email.com"
						required
						disabled={loading}
						class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100"
					/>
				</div>

				{#if error}
					<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
						{error}
					</div>
				{/if}

				<button
					type="submit"
					disabled={loading || !email}
					class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
				>
					{loading ? 'Authenticating...' : 'Login'}
				</button>
			</form>

			<p class="text-center text-slate-500 text-sm mt-6">
				Enter your email address to continue
			</p>
		</div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>
