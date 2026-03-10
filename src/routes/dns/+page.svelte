<script lang="ts">
	import Page from '$lib/page/Page.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { toastSuccess } from '$lib/common/funcs';
	import { debug } from '$lib/common/debug';
	import { App } from '$lib/States.svelte';
	import { page } from '$app/state';

	import RawMdiDns from '~icons/mdi/dns';
	import RawMdiDelete from '~icons/mdi/delete-outline';
	import RawMdiPlus from '~icons/mdi/plus';
	import RawMdiRefresh from '~icons/mdi/refresh';
	import RawMdiToggleOn from '~icons/mdi/toggle-switch';
	import RawMdiToggleOff from '~icons/mdi/toggle-switch-off';

	const ToastStore = getToastStore();

	// Config API settings - stored in localStorage
	let configApiUrl = $state(localStorage.getItem('configApiUrl') || (page.url.origin + '/config-api'));
	let configApiKey = $state(localStorage.getItem('configApiKey') || '');
	let configApiKeyShow = $state(false);

	type DnsConfig = {
		magic_dns: boolean;
		base_domain: string;
		override_local_dns: boolean;
		nameservers: {
			global: string[];
			split: Record<string, string[]>;
		};
		search_domains: string[];
		extra_records: { name: string; type: string; value: string }[];
	};

	let dns = $state<DnsConfig | null>(null);
	let loading = $state(false);
	let loadError = $state('');

	// Form state
	let newBaseDomain = $state('');
	let newGlobalNs = $state('');
	let newSplitDomain = $state('');
	let newSplitNs = $state('');
	let newSearchDomain = $state('');
	let newRecordName = $state('');
	let newRecordType = $state('A');
	let newRecordValue = $state('');

	async function apiCall(path: string, method = 'GET', body?: object) {
		const url = configApiUrl.replace(/\/$/, '') + path;
		const res = await fetch(url, {
			method,
			headers: {
				'Authorization': `Bearer ${configApiKey}`,
				'Content-Type': 'application/json',
			},
			body: body ? JSON.stringify(body) : undefined,
		});
		if (!res.ok) {
			const text = await res.text();
			throw new Error(`API error ${res.status}: ${text}`);
		}
		return res.json();
	}

	async function loadDns() {
		loading = true;
		loadError = '';
		try {
			localStorage.setItem('configApiUrl', configApiUrl);
			localStorage.setItem('configApiKey', configApiKey);
			dns = await apiCall('/dns');
			newBaseDomain = dns?.base_domain || '';
		} catch (e: any) {
			loadError = e.message;
			debug(e);
		} finally {
			loading = false;
		}
	}

	async function renameTailnet() {
		if (!newBaseDomain || newBaseDomain === dns?.base_domain) return;
		loading = true;
		try {
			await apiCall('/dns/rename', 'POST', { new_name: newBaseDomain });
			await loadDns();
			toastSuccess('Tailnet renamed', ToastStore);
		} catch (e: any) { loadError = e.message; } finally { loading = false; }
	}

	async function toggleMagicDns() {
		if (!dns) return;
		loading = true;
		try {
			await apiCall('/dns/magic', 'POST', { enabled: !dns.magic_dns });
			await loadDns();
			toastSuccess('Magic DNS updated', ToastStore);
		} catch (e: any) { loadError = e.message; } finally { loading = false; }
	}

	async function toggleOverrideDns() {
		if (!dns) return;
		loading = true;
		try {
			await apiCall('/dns/override', 'POST', { override: !dns.override_local_dns });
			await loadDns();
			toastSuccess('Override DNS updated', ToastStore);
		} catch (e: any) { loadError = e.message; } finally { loading = false; }
	}

	async function addGlobalNs() {
		if (!newGlobalNs) return;
		loading = true;
		try {
			await apiCall('/dns/nameservers/add', 'POST', { ns: newGlobalNs, split_name: 'global' });
			newGlobalNs = '';
			await loadDns();
			toastSuccess('Nameserver added', ToastStore);
		} catch (e: any) { loadError = e.message; } finally { loading = false; }
	}

	async function removeGlobalNs(ns: string) {
		loading = true;
		try {
			await apiCall('/dns/nameservers/remove', 'POST', { ns, split_name: 'global' });
			await loadDns();
			toastSuccess('Nameserver removed', ToastStore);
		} catch (e: any) { loadError = e.message; } finally { loading = false; }
	}

	async function addSplitNs() {
		if (!newSplitDomain || !newSplitNs) return;
		loading = true;
		try {
			await apiCall('/dns/nameservers/add', 'POST', { ns: newSplitNs, split_name: newSplitDomain });
			newSplitNs = '';
			newSplitDomain = '';
			await loadDns();
			toastSuccess('Split nameserver added', ToastStore);
		} catch (e: any) { loadError = e.message; } finally { loading = false; }
	}

	async function removeSplitNs(domain: string, ns: string) {
		loading = true;
		try {
			await apiCall('/dns/nameservers/remove', 'POST', { ns, split_name: domain });
			await loadDns();
			toastSuccess('Nameserver removed', ToastStore);
		} catch (e: any) { loadError = e.message; } finally { loading = false; }
	}

	async function addSearchDomain() {
		if (!newSearchDomain) return;
		loading = true;
		try {
			await apiCall('/dns/search_domains/add', 'POST', { domain: newSearchDomain });
			newSearchDomain = '';
			await loadDns();
			toastSuccess('Search domain added', ToastStore);
		} catch (e: any) { loadError = e.message; } finally { loading = false; }
	}

	async function removeSearchDomain(domain: string) {
		loading = true;
		try {
			await apiCall('/dns/search_domains/remove', 'POST', { domain });
			await loadDns();
			toastSuccess('Search domain removed', ToastStore);
		} catch (e: any) { loadError = e.message; } finally { loading = false; }
	}

	async function addRecord() {
		if (!newRecordName || !newRecordType || !newRecordValue) return;
		loading = true;
		try {
			await apiCall('/dns/records/add', 'POST', { name: newRecordName, type: newRecordType, value: newRecordValue });
			newRecordName = '';
			newRecordValue = '';
			await loadDns();
			toastSuccess('DNS record added', ToastStore);
		} catch (e: any) { loadError = e.message; } finally { loading = false; }
	}

	async function removeRecord(name: string, type: string, value: string) {
		loading = true;
		try {
			await apiCall('/dns/records/remove', 'POST', { name, type, value });
			await loadDns();
			toastSuccess('DNS record removed', ToastStore);
		} catch (e: any) { loadError = e.message; } finally { loading = false; }
	}
</script>

<Page classes="items-start">
	<PageHeader title="DNS" />

	<!-- Config API Connection -->
	<div class="w-full max-w-4xl mx-auto mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
		<h3 class="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">Config API Connection</h3>
		<div class="flex flex-col gap-3 sm:flex-row sm:items-end">
			<div class="flex-1">
				<label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">API URL</label>
				<input class="w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm"
					type="text" bind:value={configApiUrl} placeholder="https://hs.groblers.co.uk/config-api" />
			</div>
			<div class="flex-1">
				<label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">API Key</label>
				<div class="flex gap-2">
					<input class="flex-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm"
						type={configApiKeyShow ? 'text' : 'password'} bind:value={configApiKey} placeholder="API Key" />
					<button class="btn btn-sm variant-ghost" onclick={() => configApiKeyShow = !configApiKeyShow}>
						{configApiKeyShow ? '🙈' : '👁'}
					</button>
				</div>
			</div>
			<button class="btn btn-sm variant-filled-primary flex items-center gap-1" onclick={loadDns} disabled={loading}>
				<RawMdiRefresh class={loading ? 'animate-spin' : ''} /> Load
			</button>
		</div>
		{#if loadError}
			<p class="mt-2 text-sm text-red-500">{loadError}</p>
		{/if}
	</div>

	{#if dns}
	<div class="w-full max-w-4xl mx-auto space-y-6">

		<!-- Tailnet Name -->
		<div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
			<h3 class="text-lg font-semibold mb-1 text-gray-700 dark:text-gray-200">Tailnet Name</h3>
			<p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
				Devices are accessible at <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">[device].{dns.base_domain}</code> when Magic DNS is enabled.
			</p>
			<div class="flex gap-2">
				<input class="flex-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm"
					type="text" bind:value={newBaseDomain} disabled={loading} />
				<button class="btn btn-sm variant-filled-primary" onclick={renameTailnet}
					disabled={loading || newBaseDomain === dns.base_domain}>
					Rename
				</button>
			</div>
		</div>

		<!-- Magic DNS & Override DNS -->
		<div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
			<h3 class="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">DNS Options</h3>
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<div>
						<p class="font-medium text-gray-700 dark:text-gray-200">Magic DNS</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Automatically register domain names for each device on the tailnet.</p>
					</div>
					<button class="btn btn-sm px-0 text-2xl {dns.magic_dns ? 'text-success-600' : 'text-error-600'}"
						onclick={toggleMagicDns} disabled={loading}>
						{#if dns.magic_dns}<RawMdiToggleOn />{:else}<RawMdiToggleOff />{/if}
					</button>
				</div>
				<hr class="border-gray-200 dark:border-gray-700" />
				<div class="flex items-center justify-between">
					<div>
						<p class="font-medium text-gray-700 dark:text-gray-200">Override Local DNS</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Override DNS servers on devices with the Tailnet nameservers.</p>
					</div>
					<button class="btn btn-sm px-0 text-2xl {dns.override_local_dns ? 'text-success-600' : 'text-error-600'}"
						onclick={toggleOverrideDns} disabled={loading}>
						{#if dns.override_local_dns}<RawMdiToggleOn />{:else}<RawMdiToggleOff />{/if}
					</button>
				</div>
			</div>
		</div>

		<!-- Global Nameservers -->
		<div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
			<h3 class="text-lg font-semibold mb-1 text-gray-700 dark:text-gray-200">Global Nameservers</h3>
			<p class="text-sm text-gray-500 dark:text-gray-400 mb-3">DNS servers used by all devices on the Tailnet.</p>
			<div class="space-y-2 mb-3">
				{#each dns.nameservers.global as ns}
					<div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded px-3 py-2">
						<code class="text-sm">{ns}</code>
						<button class="btn btn-sm text-error-600 px-1" onclick={() => removeGlobalNs(ns)} disabled={loading}>
							<RawMdiDelete />
						</button>
					</div>
				{/each}
			</div>
			<div class="flex gap-2">
				<input class="flex-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm"
					type="text" bind:value={newGlobalNs} placeholder="e.g. 1.1.1.1" disabled={loading} />
				<button class="btn btn-sm variant-filled-primary flex items-center gap-1" onclick={addGlobalNs} disabled={loading || !newGlobalNs}>
					<RawMdiPlus /> Add
				</button>
			</div>
		</div>

		<!-- Split DNS -->
		<div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
			<h3 class="text-lg font-semibold mb-1 text-gray-700 dark:text-gray-200">Split DNS Nameservers</h3>
			<p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Domain-specific nameservers for split DNS resolution.</p>
			<div class="space-y-4 mb-4">
				{#each Object.entries(dns.nameservers.split) as [domain, servers]}
					<div class="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
						<p class="font-mono text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{domain}</p>
						<div class="space-y-1">
							{#each servers as ns}
								<div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded px-3 py-1.5">
									<code class="text-sm">{ns}</code>
									<button class="btn btn-sm text-error-600 px-1" onclick={() => removeSplitNs(domain, ns)} disabled={loading}>
										<RawMdiDelete />
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
			<div class="flex flex-col gap-2 sm:flex-row">
				<input class="flex-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm"
					type="text" bind:value={newSplitDomain} placeholder="Domain (e.g. local.example.com)" disabled={loading} />
				<input class="flex-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm"
					type="text" bind:value={newSplitNs} placeholder="Nameserver (e.g. 192.168.1.1)" disabled={loading} />
				<button class="btn btn-sm variant-filled-primary flex items-center gap-1 whitespace-nowrap"
					onclick={addSplitNs} disabled={loading || !newSplitDomain || !newSplitNs}>
					<RawMdiPlus /> Add
				</button>
			</div>
		</div>

		<!-- Search Domains -->
		<div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
			<h3 class="text-lg font-semibold mb-1 text-gray-700 dark:text-gray-200">Search Domains</h3>
			<p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Custom DNS search domains for your Tailnet.</p>
			<div class="space-y-2 mb-3">
				{#each dns.search_domains as domain}
					<div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded px-3 py-2">
						<code class="text-sm">{domain}</code>
						<button class="btn btn-sm text-error-600 px-1" onclick={() => removeSearchDomain(domain)} disabled={loading}>
							<RawMdiDelete />
						</button>
					</div>
				{/each}
			</div>
			<div class="flex gap-2">
				<input class="flex-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm"
					type="text" bind:value={newSearchDomain} placeholder="e.g. local.example.com" disabled={loading} />
				<button class="btn btn-sm variant-filled-primary flex items-center gap-1" onclick={addSearchDomain} disabled={loading || !newSearchDomain}>
					<RawMdiPlus /> Add
				</button>
			</div>
		</div>

		<!-- DNS Records -->
		<div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
			<h3 class="text-lg font-semibold mb-1 text-gray-700 dark:text-gray-200">DNS Records</h3>
			<p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Custom A and AAAA records for your Tailnet.</p>
			{#if dns.extra_records.length === 0}
				<p class="text-sm text-gray-400 italic mb-3">No DNS records found.</p>
			{:else}
				<div class="space-y-2 mb-3">
					{#each dns.extra_records as record}
						<div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded px-3 py-2">
							<div class="flex gap-3 text-sm">
								<span class="font-semibold text-gray-500 dark:text-gray-400 w-12">{record.type}</span>
								<code class="text-gray-700 dark:text-gray-200">{record.name}</code>
								<span class="text-gray-500">→</span>
								<code class="text-gray-700 dark:text-gray-200">{record.value}</code>
							</div>
							<button class="btn btn-sm text-error-600 px-1" onclick={() => removeRecord(record.name, record.type, record.value)} disabled={loading}>
								<RawMdiDelete />
							</button>
						</div>
					{/each}
				</div>
			{/if}
			<div class="flex flex-col gap-2 sm:flex-row">
				<input class="flex-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm"
					type="text" bind:value={newRecordName} placeholder="Name (e.g. myhost.example.com)" disabled={loading} />
				<select class="rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm"
					bind:value={newRecordType} disabled={loading}>
					<option value="A">A</option>
					<option value="AAAA">AAAA</option>
				</select>
				<input class="flex-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm"
					type="text" bind:value={newRecordValue} placeholder="Value (e.g. 192.168.1.1)" disabled={loading} />
				<button class="btn btn-sm variant-filled-primary flex items-center gap-1 whitespace-nowrap"
					onclick={addRecord} disabled={loading || !newRecordName || !newRecordValue}>
					<RawMdiPlus /> Add
				</button>
			</div>
		</div>

	</div>
	{/if}
</Page>
