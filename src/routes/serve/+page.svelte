<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import PageBackground from '$lib/components/PageBackground.svelte';
	import UserSearch from '$lib/components/UserSearch.svelte';
	import ItemSelector from '$lib/components/ItemSelector.svelte';
	import { fade, fly } from 'svelte/transition';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let activePerm = $state<any>(null);
	let selectedUser = $state<any>(null);
	let selectedType = $state<'boisson' | 'consommable'>('boisson');
	let transactions = $state<any[]>([]);
	let loading = $state(false);
	let serverLoading = $state(true); // Initial load
	let error = $state('');
	let lastSuccess = $state<{ user: string; item: string } | null>(null);

	// Derived state for permissions and mode
	let isCercleux = $derived(data.user?.role === 'cercleux');
	let isHorsPerm = $derived(!activePerm && isCercleux);

	onMount(async () => {
		try {
			const res = await fetch('/api/perms/active');
			if (res.ok) {
				const perm = await res.json();
				// API returns empty object or null if no active perm?
				// Usually returns 200 with content or 204 or 404.
				// Assuming it returns null or the perm object.
				activePerm = perm && perm.id ? perm : null;
				if (activePerm) loadTransactions();
			}
		} catch (e) {
			console.error(e);
		} finally {
			serverLoading = false;
		}
	});

	async function loadTransactions() {
		// If Hors Perm, maybe we don't load history, or we need a special endpoint?
		// getPermTransactions requires permId.
		// getUserTransactions requires userId.
		// We don't have a "getRecentGlobalTransactions" public endpoint.
		// For now, only load history if activePerm.
		if (!activePerm) {
			transactions = [];
			return;
		}
		try {
			const res = await fetch(`/api/transactions?permId=${activePerm.id}&limit=10`);
			if (res.ok) transactions = await res.json();

			// Load Perm Carte
			await loadCarte();
		} catch (e) {
			console.error(e);
		}
	}

	let carteItems = $state<any[]>([]);

	let currentCarteItems = $derived(
		activePerm
			? carteItems
					.filter((i) => (selectedType === 'boisson' ? i.type === 'boisson' : i.type === 'consommable'))
					// Apply sales restrictions
					.map((i) => {
						let disabled = false;
						let reason = '';

						if (selectedUser) {
							if (selectedUser.statut_cotisation === 'non_cotisant') {
								disabled = true;
								reason = 'Non Cotisant';
							} else if (selectedUser.statut_cotisation === 'cotisant_sans_alcool') {
								// Check alcohol
								// Assuming type 'boisson' and degree > 0 implies alcohol
								if (i.type === 'boisson' && (i.contenu_degre > 0 || i.contenu_type === 'biere')) {
									disabled = true;
									reason = 'Sans Alcool';
								}
							}
						}
						return { ...i, disabled, reason };
					})
			: []
	);

	// Accès Rapide : Top 5 des items récemment vendus
	let quickAccessItems = $derived.by(() => {
		if (!activePerm || transactions.length === 0) return [];
		const uniqueKeys = new Set<string>();
		const result: any[] = [];

		for (const tx of transactions) {
			if (tx.type !== 'B' && tx.type !== 'C') continue;
			const key = `${tx.type}_${tx.id_item}`;
			if (!uniqueKeys.has(key)) {
				uniqueKeys.add(key);
				// Trouver l'item correspondant dans carteItems
				const item = carteItems.find(
					(i) =>
						(tx.type === 'B' ? i.type === 'boisson' : i.type === 'consommable') && i.id === tx.id_item
				);
				if (item) {
					// Appliquer les restrictions au vol
					let disabled = false;
					let reason = '';
					if (selectedUser) {
						if (selectedUser.statut_cotisation === 'non_cotisant') {
							disabled = true;
							reason = 'Cotis.';
						} else if (
							selectedUser.statut_cotisation === 'cotisant_sans_alcool' &&
							item.type === 'boisson' &&
							(item.contenu_degre > 0 || item.contenu_type === 'biere')
						) {
							disabled = true;
							reason = 'Alcool';
						}
					}
					result.push({ ...item, disabled, reason });
				}
			}
			if (result.length >= 5) break;
		}
		return result;
	});

	async function loadCarte() {
		if (!activePerm) return;
		try {
			const res = await fetch(`/api/perms/${activePerm.id}/carte`);
			if (res.ok) {
				const carte = await res.json();
				// Transform { type, id_item, detail } -> detail
				carteItems = carte.map((c: any) => ({
					...c.detail,
					type: c.type === 'B' ? 'boisson' : 'consommable'
				}));
			}
		} catch (e) {
			console.error('Error loading carte', e);
		}
	}

	async function handleTransaction(item: any, quantity: number) {
		if (!selectedUser) return;

		// Restriction Checks
		if (selectedUser.statut_cotisation === 'non_cotisant') {
			error = 'Vente interdite aux non cotisants';
			setTimeout(() => (error = ''), 3000);
			return;
		}
		if (selectedUser.statut_cotisation === 'cotisant_sans_alcool') {
			if (item.type === 'boisson' && (item.contenu_degre > 0 || item.contenu_type === 'biere')) {
				error = 'Vente alcool interdite (Cotisant Sans Alcool)';
				setTimeout(() => (error = ''), 3000);
				return;
			}
		}

		if (!activePerm && !isHorsPerm) return;

		loading = true;

		try {
			const res = await fetch('/api/transactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: selectedUser.id,
					permId: activePerm?.id || null, // Optional if Hors Perm
					itemId: item.id,
					quantity: quantity,
					price: item.prix_vente,
					type: selectedType === 'boisson' ? 'B' : 'C'
				})
			});

			if (res.ok) {
				lastSuccess = { user: selectedUser.prenom, item: item.nom };
				setTimeout(() => (lastSuccess = null), 3000);

				// Refresh transactions and clear user
				await loadTransactions();
				selectedUser = null;
			} else {
				const err = await res.json();
				error = err.error || 'Erreur transaction';
				setTimeout(() => (error = ''), 3000);
			}
		} catch (e) {
			error = 'Erreur réseau';
			setTimeout(() => (error = ''), 3000);
		} finally {
			loading = false;
		}
	}

	function selectUser(u: any) {
		selectedUser = u;
	}
</script>

<PageBackground variant="minimal" />

{#if error}
	<div
		class="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-error text-white px-6 py-4 rounded-xl shadow-2xl animate-bounce font-bold border-2 border-white/20"
		in:fly={{ y: -50 }}
		out:fade
	>
		<div class="flex items-center gap-3">
			<Icon name="AlertCircle" size={24} />
			{error}
		</div>
	</div>
{/if}

<div class="min-h-screen pt-20 pb-32 md:pb-10 px-4 md:px-8 max-w-[1800px] mx-auto">
	{#if serverLoading}
		<div class="flex items-center justify-center h-64 text-brand-red">
			<Icon name="Loader2" class="animate-spin" size={48} />
		</div>
	{:else if !activePerm && !isHorsPerm}
		<div class="text-center mt-20">
			<div class="inline-block p-6 rounded-full bg-bg-card text-text-muted mb-6 shadow-lg">
				<Icon name="Store" size={64} />
			</div>
			<h1 class="text-3xl font-bold text-text-primary mb-2">Aucune permanence en cours</h1>
			<p class="text-text-muted">
				Ouvrez une permanence depuis le menu Admin pour commencer le service.
			</p>
			<a
				href="/admin"
				class="inline-block mt-6 px-6 py-3 bg-brand-red text-white rounded-xl font-bold hover:bg-brand-red-hover transition-colors shadow-lg shadow-brand-red/20"
			>
				Aller à l'administration
			</a>
		</div>
	{:else}
		<!-- Active Perm OR Hors Perm -->
		<div class="flex flex-col xl:flex-row gap-8 h-[calc(100vh-8rem)]">
			<!-- LEFT PANEL: SERVICE -->
			<div class="flex-1 flex flex-col gap-6">
				<!-- Header Info -->
				<div
					class="flex items-center justify-between border p-4 rounded-2xl backdrop-blur-md transition-colors shadow-sm
                    {isHorsPerm
						? 'bg-orange-500/10 border-orange-500/30'
						: 'bg-bg-card border-border'}"
				>
					<div class="flex items-center gap-4">
						<div
							class="w-12 h-12 rounded-xl flex items-center justify-center
                            {isHorsPerm
								? 'bg-orange-500/20 text-orange-500'
								: 'bg-emerald-500/20 text-emerald-500'}"
						>
							<Icon name={isHorsPerm ? 'ShieldAlert' : 'Store'} size={24} />
						</div>
						<div>
							<h2 class="font-bold text-text-primary text-lg">
								{isHorsPerm ? 'SERVICE HORS PERM' : activePerm.nom}
							</h2>
							<div
								class="flex items-center gap-2 text-xs font-mono {isHorsPerm
									? 'text-orange-400'
									: 'text-emerald-400'}"
							>
								<span
									class="w-2 h-2 rounded-full animate-pulse {isHorsPerm
										? 'bg-orange-500'
										: 'bg-emerald-500'}"
								></span>
								{isHorsPerm ? 'MODE ADMIN' : 'EN COURS'}
							</div>
						</div>
					</div>
					<div class="text-right hidden sm:block">
						<div class="text-text-muted text-xs uppercase tracking-widest">Aujourd'hui</div>
						<div class="font-mono text-xl text-text-primary font-bold">
							{new Date().toLocaleDateString()}
						</div>
					</div>
				</div>

				<!-- User Selection Area -->
				<div class="relative z-20">
					{#if !selectedUser}
						<div
							class="bg-bg-card border border-border p-8 rounded-3xl backdrop-blur-md text-center py-20 border-dashed border-2 hover:border-brand-red/50 transition-colors group shadow-xl"
						>
							<div class="mb-6 text-text-muted group-hover:text-text-primary transition-colors">
								<Icon name="Search" size={48} class="mx-auto" />
							</div>
							<h3 class="text-2xl font-bold text-text-primary mb-2">Qui a soif ?</h3>
							<div class="max-w-md mx-auto relative mt-6">
								<UserSearch
									onSelect={selectUser}
									placeholder="Carte ou nom..."
									class="w-full h-14 pl-12 pr-4 rounded-xl bg-bg-secondary border border-border focus:border-brand-red outline-none text-text-primary transition-all shadow-xl"
								/>
							</div>
						</div>
					{:else}
						<div
							class="bg-gradient-to-br from-brand-red/10 to-bg-card border border-brand-red/30 p-6 rounded-3xl flex items-center justify-between shadow-2xl relative overflow-hidden"
							in:fly={{ y: 20 }}
						>
							<div
								class="absolute right-0 top-0 w-64 h-64 bg-brand-red/10 blur-[100px] pointer-events-none"
							></div>

							<div class="flex items-center gap-6 relative z-10">
								<div
									class="w-20 h-20 rounded-2xl bg-brand-red flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden"
								>
									{#if selectedUser.photo_url}
										<img src={selectedUser.photo_url} alt="Avatar" class="w-full h-full object-cover" />
									{:else}
										{selectedUser.prenom[0]}{selectedUser.nom[0]}
									{/if}
								</div>
								<div>
									<h2 class="text-3xl font-black text-text-primary">
										{selectedUser.prenom}
										{selectedUser.nom}
									</h2>
									<div class="flex items-center gap-3 mt-1">
										<span
											class="px-2 py-0.5 rounded text-xs font-bold uppercase bg-bg-secondary text-text-muted"
											>{selectedUser.role}</span
										>
										<div
											class="font-mono text-xl {selectedUser.solde < 0 ? 'text-red-500' : 'text-emerald-400'}"
										>
											{selectedUser.solde.toFixed(2)} €
										</div>
									</div>
								</div>
							</div>

							<button
								onclick={() => (selectedUser = null)}
								class="relative z-10 p-4 bg-bg-secondary hover:bg-bg-tertiary rounded-xl text-text-primary transition-colors"
							>
								<Icon name="X" size={24} />
							</button>
						</div>

						<div
							class="flex-1 bg-bg-card border border-border rounded-3xl p-6 mt-6 backdrop-blur-md overflow-y-auto flex flex-col gap-4 shadow-xl"
						>
							{#if quickAccessItems.length > 0}
								<div class="mb-2">
									<div class="flex items-center gap-2 mb-3 px-1">
										<Icon name="Zap" size={14} class="text-brand-yellow" />
										<span class="text-[10px] font-bold uppercase tracking-widest text-text-muted"
											>Accès Rapide</span
										>
									</div>
									<div class="flex flex-wrap gap-2">
										{#each quickAccessItems as item}
											<button
												onclick={() => handleTransaction(item, 1)}
												disabled={item.disabled}
												class="flex items-center gap-2 px-3 py-2 bg-bg-secondary border border-border rounded-xl hover:border-brand-red/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
											>
												<div class="text-brand-red group-hover:scale-110 transition-transform">
													<Icon name={item.icone || (item.type === 'boisson' ? 'Beer' : 'Utensils')} size={16} />
												</div>
												<span class="text-xs font-bold text-text-primary">{item.nom || item.contenu_nom}</span>
												{#if item.reason}
													<span class="text-[8px] bg-red-500/10 text-red-500 px-1 rounded">{item.reason}</span>
												{/if}
											</button>
										{/each}
									</div>
								</div>
								<div class="border-t border-border my-2"></div>
							{/if}

							<div class="flex p-1 bg-bg-secondary rounded-xl">
								<button
									class="flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all {selectedType ===
									'boisson'
										? 'bg-brand-red text-white shadow-lg'
										: 'text-text-muted hover:bg-bg-tertiary'}"
									onclick={() => (selectedType = 'boisson')}
								>
									<div class="flex items-center justify-center gap-2">
										<Icon name="Beer" size={16} /> Soif
									</div>
								</button>
								<button
									class="flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all {selectedType ===
									'consommable'
										? 'bg-brand-red text-white shadow-lg'
										: 'text-text-muted hover:bg-bg-tertiary'}"
									onclick={() => (selectedType = 'consommable')}
								>
									<div class="flex items-center justify-center gap-2">
										<Icon name="Utensils" size={16} /> Miam
									</div>
								</button>
							</div>

							<!-- Carte Filtering Logic & UI -->
							{#if activePerm && currentCarteItems.length === 0}
								<div
									class="text-center py-10 bg-bg-secondary/50 rounded-2xl border border-border border-dashed"
								>
									<Icon name="Slash" class="mb-4 mx-auto text-text-muted" size={32} />
									<h3 class="text-lg font-bold text-text-primary">La carte est vide</h3>
									<p class="text-sm text-text-muted mb-4">
										Aucun item de ce type n'a été ajouté à cette perm.
									</p>
									{#if isCercleux}
										<a href="/admin" class="text-brand-red hover:underline">Gérer la carte dans l'admin</a>
									{/if}
								</div>
							{:else}
								<ItemSelector
									type={selectedType}
									onSelect={handleTransaction}
									items={activePerm ? currentCarteItems : []}
								/>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<!-- RIGHT PANEL: HISTORY -->
			<div class="w-full xl:w-96 bg-bg-secondary border-l border-border p-6 hidden xl:flex flex-col">
				<h3
					class="font-bold text-text-muted uppercase tracking-widest text-xs mb-6 flex items-center gap-2"
				>
					<Icon name="History" size={14} /> Dernières commandes
				</h3>

				{#if lastSuccess}
					<div
						class="mb-6 bg-success/20 border border-success/30 p-4 rounded-xl flex items-center gap-4 text-success"
						transition:fly={{ y: -20 }}
					>
						<div class="bg-success text-white p-2 rounded-full">
							<Icon name="Check" size={16} />
						</div>
						<div>
							<div class="font-bold text-text-primary">Commande validée</div>
							<div class="text-xs opacity-80">{lastSuccess.user} a pris {lastSuccess.item}</div>
						</div>
					</div>
				{/if}

				<div class="space-y-3 overflow-y-auto flex-1 pr-2">
					{#each transactions as tx}
						<div
							class="flex items-center justify-between p-3 rounded-xl hover:bg-bg-tertiary transition-colors group border border-transparent hover:border-border"
						>
							<div class="flex items-center gap-3">
								<div
									class="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-xs font-bold text-text-muted"
								>
									{tx.user_prenom ? tx.user_prenom[0] : '?'}
								</div>
								<div>
									<div class="font-bold text-text-primary text-sm">
										{tx.boisson_nom || tx.consommable_nom || 'Transaction'}
									</div>
									<div class="text-[10px] text-text-muted">
										{tx.user_prenom || 'Inconnu'} • {tx.date
											? new Date(tx.date * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
											: ''}
									</div>
								</div>
							</div>
							<div class="font-mono text-text-primary font-bold text-sm">
								{tx.prix ? Math.abs(tx.prix).toFixed(2) : '0.00'}€
							</div>
						</div>
					{/each}
					{#if transactions.length === 0}
						<div class="text-center py-10 opacity-50 text-sm">Aucune transaction récente</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
