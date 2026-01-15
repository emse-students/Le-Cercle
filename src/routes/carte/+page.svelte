<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import PageBackground from '$lib/components/PageBackground.svelte';
	import EditItemModal from '$lib/components/EditItemModal.svelte';
	import StockModal from '$lib/components/StockModal.svelte';
	import { formatCurrency } from '$lib/theme-config';
	import { page } from '$app/stores';

	let isCercleux = $derived($page.data.user?.role === 'cercleux');

	let boissons = $state<any[]>([]);
	let consommables = $state<any[]>([]);
	let loading = $state(true);
	let activeTab = $state<'boissons' | 'consommables'>('boissons');
	let showModal = $state(false);
	let showStockModal = $state(false);
	let editingItem = $state<any>(null);
	let stockItem = $state<any>(null);
	let stockType = $state<'boisson' | 'consommable'>('boisson');
	let editingType = $state<'boisson' | 'consommable'>('boisson');

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		loading = true;
		try {
			const [boissonRes, consommableRes] = await Promise.all([
				fetch('/api/boissons'),
				fetch('/api/consommables')
			]);

			if (boissonRes.ok) boissons = await boissonRes.json();
			if (consommableRes.ok) consommables = await consommableRes.json();
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	function openEditModal(item: any, type: 'boisson' | 'consommable') {
		editingItem = item;
		editingType = type;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingItem = null;
	}

	function openCreateModal(type: 'boisson' | 'consommable') {
		editingItem = null;
		editingType = type;
		showModal = true;
	}

	function openStockModal(item: any, type: 'boisson' | 'consommable') {
		stockItem = item;
		stockType = type;
		showStockModal = true;
	}

	function closeStockModal() {
		showStockModal = false;
		stockItem = null;
	}

	const iconColors: Record<string, string> = {
		// Boissons
		Beer: 'text-amber-400 bg-amber-400/10',
		Wine: 'text-red-500 bg-red-500/10',
		Coffee: 'text-amber-800 bg-amber-800/10',
		CupSoda: 'text-amber-600 bg-amber-600/10',
		Droplet: 'text-blue-400 bg-blue-400/10',
		GlassWater: 'text-cyan-400 bg-cyan-400/10',
		Milk: 'text-blue-100 bg-blue-100/10',
		Flame: 'text-orange-500 bg-orange-500/10',
		// Consommables
		Pizza: 'text-orange-500 bg-orange-500/10',
		Sandwich: 'text-yellow-600 bg-yellow-600/10',
		Cookie: 'text-amber-700 bg-amber-700/10',
		Beef: 'text-red-700 bg-red-700/10',
		Cherry: 'text-red-500 bg-red-500/10',
		Carrot: 'text-orange-500 bg-orange-500/10',
		Apple: 'text-green-500 bg-green-500/10',
		Utensils: 'text-slate-400 bg-slate-400/10',
		Salad: 'text-green-400 bg-green-400/10',
		Fish: 'text-blue-400 bg-blue-400/10',
		CookingPot: 'text-amber-500 bg-amber-500/10',
		Candy: 'text-purple-400 bg-purple-400/10',
		Croissant: 'text-yellow-500 bg-yellow-500/10',
		CakeSlice: 'text-pink-400 bg-pink-400/10'
	};

	function getIconColorClass(iconName: string) {
		return iconColors[iconName] || 'text-brand-red bg-brand-red/10';
	}

	function getScoreCuite(item: any, type: 'boisson' | 'consommable') {
		const degre =
			type === 'boisson' ? item.contenu_degre : item.nom?.toLowerCase()?.includes('alcool') ? 5 : 0; // Mock degre for alcoholic snacks if any
		const volume_ml = type === 'boisson' ? item.contenant_capacite || 0 : item.volume_ml || 0;
		const prix = item.prix_vente || 1;

		if (!degre || !volume_ml || !prix) return 0;
		// Formula: (degre% * volume_L) / price_EUR
		// 100% = 5.0 (ex: 50cl 10% for 1€, or 50cl 5% for 0.5€)
		const rawScore = (degre * (volume_ml / 1000)) / prix;
		return Math.min(100, Math.max(0, (rawScore / 5) * 100));
	}
</script>

<PageBackground variant="minimal" />

<div class="min-h-screen pt-24 pb-32 md:pb-20 px-4 max-w-7xl mx-auto">
	<header class="mb-10">
		<div class="flex items-center gap-4">
			<div class="p-4 rounded-2xl bg-brand-yellow/10 text-brand-yellow">
				<Icon name="BookOpen" size={32} />
			</div>
			<div>
				<h1 class="text-4xl font-black uppercase tracking-tighter italic text-text-primary">Carte</h1>
			</div>
		</div>

		{#if isCercleux}
			<!-- Action Buttons (Admins) -->
			<div class="flex gap-2 mt-6">
				<button
					onclick={() => openCreateModal('boisson')}
					class="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-bg-card hover:border-brand-red transition-all text-sm font-bold text-text-primary"
				>
					<Icon name="PlusCircle" size={18} class="text-brand-red" />
					Ajouter une boisson
				</button>
				<button
					onclick={() => openCreateModal('consommable')}
					class="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-bg-card hover:border-brand-red transition-all text-sm font-bold text-text-primary"
				>
					<Icon name="PlusCircle" size={18} class="text-brand-red" />
					Ajouter un snack
				</button>
			</div>
		{/if}
	</header>

	<!-- Tab Selector -->
	<div class="flex gap-4 mb-8 bg-bg-card border border-border rounded-2xl p-2">
		<button
			onclick={() => (activeTab = 'boissons')}
			class="flex-1 py-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all {activeTab ===
			'boissons'
				? 'bg-brand-red text-white shadow-lg'
				: 'text-text-muted hover:bg-bg-secondary'}"
		>
			<div class="flex items-center justify-center gap-2">
				<Icon name="Beer" size={16} /> Boissons
			</div>
		</button>
		<button
			onclick={() => (activeTab = 'consommables')}
			class="flex-1 py-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all {activeTab ===
			'consommables'
				? 'bg-brand-red text-white shadow-lg'
				: 'text-text-muted hover:bg-bg-secondary'}"
		>
			<div class="flex items-center justify-center gap-2">
				<Icon name="Utensils" size={16} /> Consommables
			</div>
		</button>
	</div>

	{#if loading}
		<div class="flex items-center justify-center h-64 text-brand-red">
			<Icon name="Loader2" class="animate-spin" size={48} />
		</div>
	{:else if activeTab === 'boissons'}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each boissons as boisson (boisson.id)}
				<div
					class="bg-bg-card border border-border rounded-2xl p-6 hover:border-border-hover transition-all group"
				>
					<div class="flex items-start justify-between mb-4">
						<div class="flex-1">
							<h3 class="font-bold text-lg text-text-primary">
								{boisson.contenu_nom || 'Inconnu'}
							</h3>
						</div>
						<div
							class="w-12 h-12 rounded-xl flex items-center justify-center transition-colors {getIconColorClass(
								boisson.icone || 'Beer'
							)}"
						>
							<Icon name={boisson.icone || 'Beer'} size={24} />
						</div>
					</div>

					<div class="space-y-2 mb-4">
						<div class="flex justify-between items-center text-sm">
							<span class="text-text-muted">Prix</span>
							<span class="text-xl font-black text-text-primary">{formatCurrency(boisson.prix_vente)}</span
							>
						</div>
						{#if boisson.contenu_degre}
							<div class="flex justify-between items-center text-sm mt-1">
								<span class="text-text-muted">Alcool</span>
								<span class="font-bold text-text-primary">{boisson.contenu_degre}°</span>
							</div>
							<div class="flex justify-between items-center text-sm mt-1">
								<span class="text-text-muted">Qualité/Cuite</span>
								<div class="flex items-center gap-2">
									<div class="w-16 h-1.5 bg-bg-primary rounded-full overflow-hidden border border-border">
										<div
											class="h-full bg-brand-red"
											style="width: {getScoreCuite(boisson, 'boisson')}%"
										></div>
									</div>
									<span
										class="font-bold text-xs {getScoreCuite(boisson, 'boisson') > 80
											? 'text-brand-red'
											: 'text-text-muted'}">{getScoreCuite(boisson, 'boisson').toFixed(0)}%</span
									>
								</div>
							</div>
						{/if}
					</div>

					<div class="flex gap-2 pt-4 border-t border-border">
						<div class="flex-1">
							<div class="text-[10px] uppercase font-bold text-text-muted mb-1">
								{boisson.contenant_type === 'fut' || boisson.contenant_type === 'cubi'
									? 'Fûts en stock'
									: 'Stock'}
							</div>
							<div class="text-xl font-bold text-success">
								{#if boisson.contenant_type === 'fut' || boisson.contenant_type === 'cubi'}
									<span
										>{(
											(boisson.nb_plein || 0) * ((boisson.contenant_capacite || 30000) / 1000) +
											(boisson.volume_restant || 0)
										).toFixed(0)} L</span
									>
									<span class="text-xs font-medium text-text-muted block font-normal mt-1">
										({boisson.nb_plein} pleins + {(boisson.volume_restant || 0).toFixed(1)}L)
									</span>
								{:else}
									{boisson.nb_plein || 0}
									<span class="text-xs font-medium text-text-muted">unités</span>
								{/if}
							</div>
						</div>
					</div>

					{#if boisson.contenant_type === 'fut' || boisson.contenant_type === 'cubi'}
						<div class="mt-4 pt-4 border-t border-border">
							<div class="flex justify-between items-center mb-2">
								<span class="text-[10px] font-bold uppercase text-text-muted">Volume restant</span>
								<span class="text-sm font-mono font-bold text-amber-500">
									{(boisson.volume_restant || 0).toFixed(1)}L / {(boisson.contenant_capacite || 30000) /
										1000}L
								</span>
							</div>
							<div class="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
								<div
									class="h-full bg-amber-500"
									style="width: {Math.min(
										100,
										Math.max(
											0,
											((boisson.volume_restant || 0) / ((boisson.contenant_capacite || 30000) / 1000)) * 100
										)
									)}%"
								></div>
							</div>
						</div>
					{/if}

					<div class="grid grid-cols-2 gap-2 mt-4">
						{#if isCercleux}
							<button
								onclick={() => openEditModal(boisson, 'boisson')}
								class="py-2.5 rounded-lg bg-bg-secondary border border-border text-text-primary font-bold text-xs uppercase hover:bg-bg-tertiary transition-all"
							>
								Modifier
							</button>
						{/if}

						{#if boisson.contenant_type === 'fut' || boisson.contenant_type === 'cubi'}
							<button
								onclick={() => openStockModal(boisson, 'boisson')}
								class="py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold text-xs uppercase hover:bg-amber-500 hover:text-black transition-all"
							>
								Recharger
							</button>
						{:else}
							<button
								onclick={() => openStockModal(boisson, 'boisson')}
								class="py-2.5 rounded-lg bg-success/10 border border-success/20 text-success font-bold text-xs uppercase hover:bg-success hover:text-black transition-all"
							>
								+ Stock
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each consommables as item (item.id)}
				<div
					class="bg-bg-card border border-border rounded-2xl p-6 hover:border-border-hover transition-all group"
				>
					<div class="flex items-start justify-between mb-4">
						<div class="flex-1">
							<h3 class="font-bold text-lg text-text-primary">{item.nom}</h3>
						</div>
						<div
							class="w-12 h-12 rounded-xl flex items-center justify-center transition-colors {getIconColorClass(
								item.icone || 'Utensils'
							)}"
						>
							<Icon name={item.icone || 'Utensils'} size={24} />
						</div>
					</div>

					<div class="space-y-2 mb-4">
						<div class="flex justify-between items-center text-sm">
							<span class="text-text-muted">Prix</span>
							<span class="text-xl font-black text-text-primary">{formatCurrency(item.prix_vente)}</span>
						</div>
						{#if item.volume_ml > 0}
							<div class="flex justify-between items-center text-sm mt-1">
								<span class="text-text-muted">Vol.</span>
								<span class="font-bold text-text-primary">{item.volume_ml} mL</span>
							</div>
						{/if}
						{#if getScoreCuite(item, 'consommable') > 0}
							<div class="flex justify-between items-center text-sm mt-1">
								<span class="text-text-muted">Qualité/Cuite</span>
								<div class="flex items-center gap-2">
									<div class="w-16 h-1.5 bg-bg-primary rounded-full overflow-hidden border border-border">
										<div
											class="h-full bg-brand-red"
											style="width: {getScoreCuite(item, 'consommable')}%"
										></div>
									</div>
									<span
										class="font-bold text-xs {getScoreCuite(item, 'consommable') > 80
											? 'text-brand-red'
											: 'text-text-muted'}">{getScoreCuite(item, 'consommable').toFixed(0)}%</span
									>
								</div>
							</div>
						{/if}
					</div>

					<div class="pt-4 border-t border-border">
						<div class="flex justify-between items-center">
							<div class="text-[10px] text-text-muted uppercase font-bold">En Stock</div>
							<div class="text-xl font-bold text-success">
								{item.stock || item.nb || 0}
								<span class="text-xs font-medium text-text-muted">unités</span>
							</div>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-2 mt-4">
						{#if isCercleux}
							<button
								onclick={() => openEditModal(item, 'consommable')}
								class="py-2.5 rounded-lg bg-bg-secondary border border-border text-text-primary font-bold text-xs uppercase hover:bg-bg-tertiary transition-all"
							>
								Modifier
							</button>
						{/if}
						<button
							onclick={() => openStockModal(item, 'consommable')}
							class="py-2.5 rounded-lg bg-success/10 border border-success/20 text-success font-bold text-xs uppercase hover:bg-success hover:text-black transition-all"
						>
							+ Stock
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if !loading && activeTab === 'boissons' && boissons.length === 0}
		<div class="text-center py-20">
			<div class="p-6 rounded-full bg-bg-card inline-block mb-4">
				<Icon name="Beer" size={64} class="text-text-muted" />
			</div>
			<h3 class="text-xl font-bold text-text-primary mb-2">Aucune boisson</h3>
			<p class="text-text-muted">Ajoutez des boissons à votre carte</p>
		</div>
	{/if}

	{#if !loading && activeTab === 'consommables' && consommables.length === 0}
		<div class="text-center py-20">
			<div class="p-6 rounded-full bg-bg-card inline-block mb-4">
				<Icon name="Utensils" size={64} class="text-text-muted" />
			</div>
			<h3 class="text-xl font-bold text-text-primary mb-2">Aucun consommable</h3>
			<p class="text-text-muted">Ajoutez des consommables à votre carte</p>
		</div>
	{/if}
</div>

<!-- Modal d'édition -->
{#if showModal}
	<EditItemModal
		bind:show={showModal}
		item={editingItem}
		type={editingType}
		onClose={closeModal}
		onSuccess={loadData}
	/>
{/if}

{#if showStockModal}
	<StockModal
		bind:show={showStockModal}
		item={stockItem}
		type={stockType}
		onClose={closeStockModal}
		onSuccess={loadData}
	/>
{/if}
