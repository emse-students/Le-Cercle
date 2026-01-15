<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import PageBackground from '$lib/components/PageBackground.svelte';
	import UserSearch from '$lib/components/UserSearch.svelte';
	import ItemSelector from '$lib/components/ItemSelector.svelte';
	import { fade, fly } from 'svelte/transition';

	let activePerm = $state<any>(null);
	let selectedUser = $state<any>(null);
	let selectedType = $state<'boisson' | 'consommable'>('boisson');
	let transactions = $state<any[]>([]);
	let loading = $state(false);
	let serverLoading = $state(true); // Initial load
	let error = $state('');
	let lastSuccess = $state<{ user: string; item: string } | null>(null);

	onMount(async () => {
		try {
			const res = await fetch('/api/perms/active');
			if (res.ok) {
				activePerm = await res.json();
				if (activePerm) loadTransactions();
			}
		} catch (e) {
			console.error(e);
		} finally {
			serverLoading = false;
		}
	});

	async function loadTransactions() {
		if (!activePerm) return;
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

	async function loadCarte() {
		if (!activePerm) return;
		try {
			const res = await fetch(`/api/perms/${activePerm.id}/carte`);
			if (res.ok) {
				const carte = await res.json();
				// Transform { type, id_item, detail } -> detail (which contains full item info)
				// Filter by type if needed, but ItemSelector filters by type prop.
				// Actually ItemSelector expects a list of items to show.
				// We should pass "all items allowed" and let ItemSelector filter by type?
				// ItemSelector filters by type using separate endpoints usually.
				// If we pass 'items' prop, we should pass ONLY the items of the selected type.

				// Let's store full carte and filter in the template
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
		if (!selectedUser || !activePerm) return;

		// Optimistic UI could be done here, but let's wait for server for safety
		loading = true;

		try {
			const res = await fetch('/api/transactions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: selectedUser.id,
					permId: activePerm.id,
					itemId: item.id,
					quantity: quantity,
					price: item.prix_vente, // Pass price
					type: selectedType === 'boisson' ? 'B' : 'C' // Pass type
				})
			});

			if (res.ok) {
				lastSuccess = { user: selectedUser.prenom, item: item.nom };
				setTimeout(() => (lastSuccess = null), 3000);

				// Refresh transactions and clear user
				await loadTransactions();
				selectedUser = null;
			} else {
				error = 'Erreur transaction';
				setTimeout(() => (error = ''), 3000);
			}
		} catch (e) {
			error = 'Erreur réseau';
		} finally {
			loading = false;
		}
	}

	function selectUser(u: any) {
		selectedUser = u;
	}
</script>

<PageBackground variant="minimal" />

<div class="min-h-screen pt-20 pb-32 md:pb-10 px-4 md:px-8 max-w-[1800px] mx-auto">
	{#if serverLoading}
		<div class="flex items-center justify-center h-64 text-rose-500">
			<Icon name="Loader2" class="animate-spin" size={48} />
		</div>
	{:else if !activePerm}
		<div class="text-center mt-20">
			<div class="inline-block p-6 rounded-full bg-slate-800 text-slate-500 mb-6">
				<Icon name="Store" size={64} />
			</div>
			<h1 class="text-3xl font-bold text-white mb-2">Aucune permanence en cours</h1>
			<p class="text-slate-400">
				Ouvrez une permanence depuis le menu Admin pour commencer le service.
			</p>
			<a
				href="/admin"
				class="inline-block mt-6 px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-500 transition-colors"
			>
				Aller à l'administration
			</a>
		</div>
	{:else}
		<div class="flex flex-col xl:flex-row gap-8 h-[calc(100vh-8rem)]">
			<!-- LEFT PANEL: SERVICE -->
			<div class="flex-1 flex flex-col gap-6">
				<!-- Header Info -->
				<div
					class="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md"
				>
					<div class="flex items-center gap-4">
						<div
							class="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-xl flex items-center justify-center"
						>
							<Icon name="Store" size={24} />
						</div>
						<div>
							<h2 class="font-bold text-white text-lg">{activePerm.nom}</h2>
							<div class="flex items-center gap-2 text-xs font-mono text-emerald-400">
								<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
								EN COURS
							</div>
						</div>
					</div>
					<div class="text-right hidden sm:block">
						<div class="text-slate-400 text-xs uppercase tracking-widest">Aujourd'hui</div>
						<div class="font-mono text-xl text-white font-bold">{new Date().toLocaleDateString()}</div>
					</div>
				</div>

				<!-- User Selection Area -->
				<div class="relative z-20">
					{#if !selectedUser}
						<div
							class="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md text-center py-20 border-dashed border-2 hover:border-rose-500/50 transition-colors group"
						>
							<div class="mb-6 text-slate-500 group-hover:text-white transition-colors">
								<Icon name="Search" size={48} class="mx-auto" />
							</div>
							<h3 class="text-2xl font-bold text-white mb-2">Qui a soif ?</h3>
							<div class="max-w-md mx-auto relative mt-6">
								<UserSearch
									onSelect={selectUser}
									placeholder="Carte ou nom..."
									class="w-full h-14 pl-12 pr-4 rounded-xl bg-black/50 border border-white/20 focus:border-rose-500 outline-none text-white transition-all shadow-xl"
								/>
							</div>
						</div>
					{:else}
						<div
							class="bg-gradient-to-br from-rose-900/40 to-black border border-rose-500/30 p-6 rounded-3xl flex items-center justify-between shadow-2xl relative overflow-hidden"
							in:fly={{ y: 20 }}
						>
							<div
								class="absolute right-0 top-0 w-64 h-64 bg-rose-600/20 blur-[100px] pointer-events-none"
							></div>

							<div class="flex items-center gap-6 relative z-10">
								<div
									class="w-20 h-20 rounded-2xl bg-rose-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden"
								>
									{#if selectedUser.photo_url}
										<img src={selectedUser.photo_url} alt="Avatar" class="w-full h-full object-cover" />
									{:else}
										{selectedUser.prenom[0]}{selectedUser.nom[0]}
									{/if}
								</div>
								<div>
									<h2 class="text-3xl font-black text-white">{selectedUser.prenom} {selectedUser.nom}</h2>
									<div class="flex items-center gap-3 mt-1">
										<span class="px-2 py-0.5 rounded text-xs font-bold uppercase bg-white/10 text-slate-300"
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
								class="relative z-10 p-4 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
							>
								<Icon name="X" size={24} />
							</button>
						</div>

						<!-- Item Selector -->
						<div
							class="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6 mt-6 backdrop-blur-md overflow-y-auto flex flex-col gap-4"
						>
							<div class="flex p-1 bg-black/40 rounded-xl">
								<button
									class="flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all {selectedType ===
									'boisson'
										? 'bg-rose-600 text-white shadow-lg'
										: 'text-slate-400 hover:bg-white/5'}"
									onclick={() => (selectedType = 'boisson')}
								>
									<div class="flex items-center justify-center gap-2">
										<Icon name="Beer" size={16} /> Soif
									</div>
								</button>
								<button
									class="flex-1 py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all {selectedType ===
									'consommable'
										? 'bg-rose-600 text-white shadow-lg'
										: 'text-slate-400 hover:bg-white/5'}"
									onclick={() => (selectedType = 'consommable')}
								>
									<div class="flex items-center justify-center gap-2">
										<Icon name="Utensils" size={16} /> Miam
									</div>
								</button>
							</div>

							<ItemSelector
								type={selectedType}
								onSelect={handleTransaction}
								items={carteItems.filter((i) =>
									selectedType === 'boisson' ? i.type === 'boisson' : i.type === 'consommable'
								)}
							/>
						</div>
					{/if}
				</div>
			</div>

			<!-- RIGHT PANEL: HISTORY -->
			<div class="w-full xl:w-96 bg-black/20 border-l border-white/5 p-6 hidden xl:flex flex-col">
				<h3
					class="font-bold text-slate-400 uppercase tracking-widest text-xs mb-6 flex items-center gap-2"
				>
					<Icon name="History" size={14} /> Dernières commandes
				</h3>

				{#if lastSuccess}
					<div
						class="mb-6 bg-emerald-500/20 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-4 text-emerald-400"
						transition:fly={{ y: -20 }}
					>
						<div class="bg-emerald-500 text-black p-2 rounded-full">
							<Icon name="Check" size={16} />
						</div>
						<div>
							<div class="font-bold text-white">Commande validée</div>
							<div class="text-xs opacity-80">{lastSuccess.user} a pris {lastSuccess.item}</div>
						</div>
					</div>
				{/if}

				<div class="space-y-3 overflow-y-auto flex-1 pr-2">
					{#each transactions as tx}
						<div
							class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group border border-transparent hover:border-white/5"
						>
							<div class="flex items-center gap-3">
								<div
									class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400"
								>
									{tx.userName ? tx.userName[0] : '?'}
								</div>
								<div>
									<div class="font-bold text-slate-200 text-sm">{tx.itemName || 'Transaction'}</div>
									<div class="text-[10px] text-slate-500">
										{tx.userName || 'Inconnu'} • {tx.created_at
											? new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
											: ''}
									</div>
								</div>
							</div>
							<div class="font-mono text-white font-bold text-sm">
								{tx.amount ? tx.amount.toFixed(2) : '0.00'}€
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
