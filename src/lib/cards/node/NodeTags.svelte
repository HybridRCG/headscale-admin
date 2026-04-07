<script lang="ts">
	import { InputChip, popup, type PopupSettings } from '@skeletonlabs/skeleton';
	import type { Node } from '$lib/common/types';
	import CardListEntry from '../CardListEntry.svelte';
	import RawMdiWarning from '~icons/mdi/warning-outline';

	type NodeTagsProps = {
		node: Node,
	}

	let {
		node = $bindable(),
	}: NodeTagsProps = $props()

	// Display tags without the "tag:" prefix
	const tags = $derived((node.tags ?? []).map((tag) => tag.replace("tag:", "")));
	const popupInfo: PopupSettings = {
		event: 'hover',
		target: 'popupTagsInfo',
		placement: 'top',
	};
</script>

<div class="space-y-4">
	<CardListEntry top title="Tags:">
		<div class="space-x-2 space-y-1">
			{#if tags.length > 0}
				{#each tags as tag}
					<button type="button" class="chip variant-filled-success">{tag}</button>
				{/each}
			{:else}
				<span class="text-surface-400 italic">No tags assigned</span>
			{/if}
		</div>
	</CardListEntry>
	<CardListEntry top>
		<span class="flex flex-row items-center">
			Advertised Tags:
		</span>
		<div class="space-x-2 space-y-1">
			{#if tags.length > 0}
				{#each tags as tag}
					<button type="button" class="chip variant-filled-success">{tag}</button>
				{/each}
			{:else}
				<span class="text-surface-400 italic">No tags advertised</span>
			{/if}
		</div>
	</CardListEntry>
</div>
