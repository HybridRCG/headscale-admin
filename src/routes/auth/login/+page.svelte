<script lang="ts">
	import { enhance } from '$app/forms';
	let email = '';
	let loading = false;
	let error = '';
	let success = false;
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
	<div class="w-full max-w-md">
		<div class="bg-white rounded-lg shadow-xl p-8">
			<h1 class="text-3xl font-bold text-center mb-2 text-slate-900">Headscale Admin</h1>
			<p class="text-center text-slate-600 mb-8">Authentication Required</p>

			{#if !success}
				<form method="POST" use:enhance={({ formElement, data, action, cancel }) => {
					loading = true;
					return async ({ result }) => {
						if (result.type === 'success') {
							success = true;
							localStorage.setItem('userEmail', result.data.user.email);
							localStorage.setItem('userName', result.data.user.name);
							localStorage.setItem('userRole', result.data.user.role);
							setTimeout(() => window.location.href = '/admin/', 500);
						} else if (result.type === 'failure') {
							error = result.data.error || 'Login failed';
						} else if (result.type === 'error') {
							error = 'Connection error: ' + result.error.message;
						}
						loading = false;
					};
				}} class="space-y-6">
					<div>
						<label for="email" class="block text-sm font-medium text-slate-700 mb-2">
							Email Address
						</label>
						<input
							id="email"
							type="email"
							name="email"
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
			{:else}
				<div class="text-center">
					<div class="text-green-600 text-lg font-semibold mb-4">✓ Login successful!</div>
					<p class="text-slate-600">Redirecting to dashboard...</p>
				</div>
			{/if}

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
