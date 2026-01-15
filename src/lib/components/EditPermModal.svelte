<script lang="ts">
	import Modal from './Modal.svelte';
	import Icon from './Icon.svelte';
	import UserSearch from './UserSearch.svelte';

	interface Props {
		show: boolean;
		perm: any; // If null, create mode. If object, edit mode.
		onClose: () => void;
		onSuccess: () => void;
	}

	let activeTab = $state('main'); // 'main' | 'carte'
	let { show = $bindable(false), perm, onClose, onSuccess }: Props = $props();

	let formData = $state({
		nom: '',
		date: new Date().toISOString().split('T')[0],
		barmen: [] as any[] // Array of user objects
	});

	let loading = $state(false);
	let error = $state('');

	// Carte Management
	let allItems = $state<{ boissons: any[]; consommables: any[] }>({
		boissons: [],
		consommables: []
	});
	let permCarte = $state<Set<string>>(new Set()); // Set of "type_id"
	let loadingCarte = $state(false);

	// Fetch details when opening for edit
	// Fetch details when opening for edit
	let lastPermId = $state<number | null>(null);

	$effect(() => {
		if (show) {
			if (perm) {
				if (perm.id !== lastPermId) {
					// Edit Mode
					lastPermId = perm.id;
					loadPermDetails(perm.id);
					loadCarteData(perm.id);
				}
			} else {
				// Create Mode
				if (lastPermId !== -1) {
					lastPermId = -1; // -1 for create mode
					formData = {
						nom: '',
						date: new Date().toISOString().split('T')[0],
						barmen: []
					};
				}
			}
		} else {
			lastPermId = null; // Reset when closed
		}
	});

	async function loadPermDetails(id: number) {
		loading = true;
		try {
			const res = await fetch(`/api/perms/${id}`);
			if (res.ok) {
				const data = await res.json();
				// data includes { ...perm, barmen: [], nom: ..., annee: ..., date: ... }
				// date is timestamp?
				const dateStr = data.date ? new Date(data.date * 1000).toISOString().split('T')[0] : '';
				formData = {
					nom: data.nom,
					date: dateStr,
					barmen: data.barmen || data.barmans || []
				};
			}
		} catch (e) {
			console.error(e);
			error = 'Erreur chargement perm';
		} finally {
			loading = false;
		}
	}

	async function loadCarteData(permId: number) {
		if (!permId) return;
		loadingCarte = true;
		try {
			// Load all available items first
			if (allItems.boissons.length === 0) {
				const [resB, resC] = await Promise.all([fetch('/api/boissons'), fetch('/api/consommables')]);
				if (resB.ok && resC.ok) {
					allItems = {
						boissons: await resB.json(),
						consommables: await resC.json()
					};
				}
			}

			// Load current perm carte
			const res = await fetch(`/api/perms/${permId}/carte`);
			if (res.ok) {
				const carte = await res.json();
				permCarte = new Set(carte.map((i: any) => `${i.type}_${i.id_item}`));
			}
		} catch (e) {
			console.error(e);
		}
		loadingCarte = false;
	}

	async function toggleCarteItem(type: 'B' | 'C', id: number) {
		if (!perm) return;

		const key = `${type}_${id}`;
		const isPresent = permCarte.has(key);

		// Optimistic update
		if (isPresent) permCarte.delete(key);
		else permCarte.add(key);
		// Force reactivity
		permCarte = new Set(permCarte);

		try {
			const method = isPresent ? 'DELETE' : 'POST';
			const url = isPresent
				? `/api/perms/${perm.id}/carte?type=${type}&idItem=${id}`
				: `/api/perms/${perm.id}/carte`;

			const body = isPresent ? undefined : JSON.stringify({ type, idItem: id });

			await fetch(url, {
				method,
				headers: isPresent ? {} : { 'Content-Type': 'application/json' },
				body
			});
		} catch (e) {
			console.error(e);
			// Revert on error
			if (isPresent) permCarte.add(key);
			else permCarte.delete(key);
			permCarte = new Set(permCarte);
		}
	}

	function addBarman(user: any) {
		if (!formData.barmen.find((b) => b.id === user.id)) {
			formData.barmen = [...formData.barmen, user];
		}
	}

	function removeBarman(id: number) {
		formData.barmen = formData.barmen.filter((b) => b.id !== id);
	}

	async function handleSubmit() {
		if (!formData.nom || !formData.date) {
			error = 'Nom et date requis';
			return;
		}

		loading = true;
		error = '';

		try {
			const payload = {
				nom: formData.nom,
				date: Math.floor(new Date(formData.date).getTime() / 1000),
				barmen: formData.barmen.map((b) => b.id)
			};

			let res;
			if (perm) {
				// Update
				res = await fetch(`/api/perms/${perm.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
			} else {
				// Create
				res = await fetch('/api/perms', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
			}

			if (res.ok) {
				onSuccess();
				onClose();
			} else {
				const err = await res.json();
				error = err.error || 'Une erreur est survenue';
			}
		} catch (e) {
			console.error(e);
			error = 'Erreur réseau';
		} finally {
			loading = false;
		}
	}

	async function toggleOpen() {
		if (!perm) return;
		loading = true;
		try {
			const action = perm.is_open ? 'close' : 'open';
			const res = await fetch('/api/perms', {
				method: 'PATCH',
				body: JSON.stringify({
					permId: perm.id,
					action: action
				})
			});
			if (res.ok) {
				onSuccess(); // Refresh parent list
				// Optionally refresh local data if we keep modal open
				perm.is_open = !perm.is_open; // Optimistic update
			}
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function deletePerm() {
		if (!perm || !confirm('Supprimer cette permanence ?')) return;
		loading = true;
		try {
			const res = await fetch(`/api/perms?id=${perm.id}`, { method: 'DELETE' });
			if (res.ok) {
				onSuccess();
				onClose();
			}
		} catch (e) {
			console.error(e);
		}
		loading = false;
	}
</script>

<Modal bind:show title={perm ? 'Modifier la Perm' : 'Nouvelle Perm'} onCancel={onClose}>
	<div class="flex gap-2 mb-6 p-1 bg-bg-secondary rounded-xl border border-border">
		<button
			onclick={() => (activeTab = 'main')}
			class="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all {activeTab ===
			'main'
				? 'bg-bg-card shadow-sm text-text-primary'
				: 'text-text-muted hover:text-text-primary'}"
		>
			Infos
		</button>
		<button
			onclick={() => (activeTab = 'carte')}
			disabled={!perm}
			class="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all {activeTab ===
			'carte'
				? 'bg-bg-card shadow-sm text-text-primary'
				: 'text-text-muted hover:text-text-primary disabled:opacity-50'}"
		>
			Carte {perm ? '' : "(Créer d'abord)"}
		</button>
	</div>

	<div class="space-y-6">
		{#if activeTab === 'main'}
			{#if error}
				<div class="bg-error/10 text-error p-3 rounded-lg text-sm">{error}</div>
			{/if}

			<!-- Nom -->
			<div>
				<label for="perm-nom" class="block text-sm font-bold text-text-muted mb-2">Nom de la perm</label
				>
				<div class="relative">
					<Icon name="Type" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
					<input
						id="perm-nom"
						type="text"
						bind:value={formData.nom}
						placeholder="Ex: Perm Khôl, Perm Halloween..."
						class="w-full bg-bg-secondary border border-border rounded-xl py-3 pl-10 pr-4 text-text-primary focus:outline-none focus:border-brand-yellow transition-colors"
					/>
				</div>
			</div>

			<!-- Date -->
			<div>
				<label for="perm-date" class="block text-sm font-bold text-text-muted mb-2">Date</label>
				<div class="relative">
					<Icon
						name="Calendar"
						class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
						size={18}
					/>
					<input
						id="perm-date"
						type="date"
						bind:value={formData.date}
						class="w-full bg-bg-secondary border border-border rounded-xl py-3 pl-10 pr-4 text-text-primary focus:outline-none focus:border-brand-yellow transition-colors"
					/>
				</div>
			</div>

			<!-- Barmen -->
			<div>
				<label class="block text-sm font-bold text-text-muted mb-2">Barmen assignés</label>
				<div class="bg-bg-secondary border border-border rounded-xl p-4 space-y-3">
					<UserSearch onSelect={addBarman} placeholder="Ajouter un barman..." />

					<div class="flex flex-wrap gap-2 mt-2">
						{#each formData.barmen as user}
							<div
								class="bg-bg-tertiary px-3 py-1 rounded-full flex items-center gap-2 text-sm border border-border"
							>
								<span>{user.prenom} {user.nom}</span>
								<button onclick={() => removeBarman(user.id)} class="text-text-muted hover:text-error">
									<Icon name="X" size={14} />
								</button>
							</div>
						{/each}
						{#if formData.barmen.length === 0}
							<p class="text-xs text-text-muted italic">Aucun barman assigné</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex flex-col gap-3 mt-8">
				<button
					onclick={handleSubmit}
					disabled={loading}
					class="w-full bg-brand-yellow text-black font-bold py-4 rounded-xl hover:bg-brand-yellow/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
				>
					{loading ? 'Enregistrement...' : perm ? 'Mettre à jour' : 'Créer la perm'}
				</button>

				{#if perm}
					<div class="grid grid-cols-2 gap-3">
						<button
							onclick={toggleOpen}
							class="py-3 rounded-xl font-bold border-2 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-wider
                        {perm.is_open
								? 'border-success text-success hover:bg-success/10'
								: 'border-text-muted text-text-muted hover:border-success hover:text-success'}"
						>
							<Icon name={perm.is_open ? 'Lock' : 'Unlock'} size={16} />
							{perm.is_open ? 'Fermer la perm' : 'Ouvrir la perm'}
						</button>

						<button
							onclick={deletePerm}
							class="py-3 rounded-xl font-bold border-2 border-error/30 text-error hover:bg-error/10 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-wider"
						>
							<Icon name="Trash2" size={16} /> Supprimer
						</button>
					</div>
				{/if}
			</div>
		{/if}

		{#if activeTab === 'carte'}
			<div class="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
				{#if loadingCarte}
					<div class="text-center py-10 text-brand-yellow animate-pulse">
						<Icon name="Loader2" class="animate-spin inline-block" size={24} />
					</div>
				{:else}
					<!-- BOISSONS -->
					<div>
						<h3
							class="text-sm font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2"
						>
							<Icon name="Beer" size={14} /> Boissons
						</h3>
						<div class="grid grid-cols-2 gap-2">
							{#each allItems.boissons as item}
								{@const isSelected = permCarte.has(`B_${item.id}`)}
								<button
									onclick={() => toggleCarteItem('B', item.id)}
									class="text-left p-3 rounded-xl border-2 transition-all group flex items-start gap-3
                                    {isSelected
										? 'border-brand-yellow bg-brand-yellow/10'
										: 'border-border hover:border-brand-yellow/50 bg-bg-secondary'}"
								>
									<div
										class="w-5 h-5 rounded-md border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors {isSelected
											? 'bg-brand-yellow border-brand-yellow'
											: 'border-text-muted group-hover:border-brand-yellow'}"
									>
										{#if isSelected}<Icon name="Check" size={12} class="text-black" />{/if}
									</div>
									<div>
										<div class="font-bold text-sm text-text-primary">
											{item.nom || `${item.contenu_nom} ${item.contenant_nom}`}
										</div>
										<div class="text-[10px] text-text-muted">{item.prix_vente.toFixed(2)}€</div>
									</div>
								</button>
							{/each}
						</div>
					</div>

					<!-- CONSOMMABLES -->
					<div>
						<h3
							class="text-sm font-bold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2 mt-6"
						>
							<Icon name="Utensils" size={14} /> Consommables
						</h3>
						<div class="grid grid-cols-2 gap-2">
							{#each allItems.consommables as item}
								{@const isSelected = permCarte.has(`C_${item.id}`)}
								<button
									onclick={() => toggleCarteItem('C', item.id)}
									class="text-left p-3 rounded-xl border-2 transition-all group flex items-start gap-3
                                    {isSelected
										? 'border-brand-yellow bg-brand-yellow/10'
										: 'border-border hover:border-brand-yellow/50 bg-bg-secondary'}"
								>
									<div
										class="w-5 h-5 rounded-md border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors {isSelected
											? 'bg-brand-yellow border-brand-yellow'
											: 'border-text-muted group-hover:border-brand-yellow'}"
									>
										{#if isSelected}<Icon name="Check" size={12} class="text-black" />{/if}
									</div>
									<div>
										<div class="font-bold text-sm text-text-primary">{item.nom}</div>
										<div class="text-[10px] text-text-muted">{item.prix_vente.toFixed(2)}€</div>
									</div>
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</Modal>
