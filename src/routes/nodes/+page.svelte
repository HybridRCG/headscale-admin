<script lang="ts">
	import CardListPage from '$lib/cards/CardListPage.svelte';
	import CardTilePage from '$lib/cards/CardTilePage.svelte';
	import PageHeader from '$lib/page/PageHeader.svelte';
	import NodeListCard from '$lib/cards/node/NodeListCard.svelte';
	import NodeTileCard from '$lib/cards/node/NodeTileCard.svelte';
	import NodeCreate from '$lib/cards/node/NodeCreate.svelte';
	import Page from '$lib/page/Page.svelte';
	import type { OnlineStatus, Direction } from '$lib/common/types';
	import SortBtn from '$lib/parts/SortBtn.svelte';
	import { getSortedFilteredNodes } from '$lib/common/funcs';
	import { App } from '$lib/States.svelte';
	import FilterOnlineBtn from '$lib/parts/FilterOnlineBtn.svelte';
	let showCreate = $state(false);
	let sortMethod = $state('id');
	let sortDirection = $state<Direction>('up');
	let filterOnlineStatus = $state<OnlineStatus>('all');
	let filterString = $state('');
	const Outer = $derived(App.layoutNode.value === 'list' ? CardListPage : CardTilePage);
	const Inner = $derived(App.layoutNode.value === 'list' ? NodeListCard : NodeTileCard);
	const nodesSortedFiltered = $derived(
		getSortedFilteredNodes(App.nodes.value, filterString, sortMethod, sortDirection, filterOnlineStatus)
	)
	function toggle(method: string) {
		if (method != sortMethod) {
			sortMethod = method;
			sortDirection = 'up';
		} else {
			sortDirection = sortDirection === 'up' ? 'down' : 'up';
		}
	}
</script>
<Page>
	{#if App.nodes.value && App.nodes.value.length > 0}
		<PageHeader title="Nodes" layout={App.layoutNode} bind:show={showCreate} bind:filterString>
			{#snippet button()}
				<NodeCreate bind:show={showCreate} />
			{/snippet}
		</PageHeader>
		<div
			class="btn-group px-0 mx-0 py-0 my-0 rounded-md variant-ghost-secondary [&>*+*]:border-primary-500"
		>
			<SortBtn bind:value={sortMethod} direction={sortDirection} name="ID" {toggle} />
			<SortBtn bind:value={sortMethod} direction={sortDirection} name="Name" {toggle} />
			<SortBtn bind:value={sortMethod} direction={sortDirection} name="Online" {toggle} />
			<FilterOnlineBtn bind:value={filterOnlineStatus} />
		</div>
		<svelte:component this={Outer}>
			{#each nodesSortedFiltered as node (node.id)}
				<svelte:component this={Inner} {node} />
			{/each}
		</svelte:component>
	{:else}
		<div class="p-8 text-center">
			<p class="text-xl">Loading nodes...</p>
			<p class="text-sm text-gray-500">Total nodes in store: {App.nodes.value?.length || 0}</p>
		</div>
	{/if}
</Page>
