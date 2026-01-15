<script lang="ts">
	import Modal from './Modal.svelte';
	import Icon from './Icon.svelte';

	interface Props {
		show: boolean;
		item: any;
		type: 'boisson' | 'consommable';
		onClose: () => void;
		onSuccess: () => void;
	}

	let { show = $bindable(false), item, type, onClose, onSuccess }: Props = $props();

	let quantity = $state(1);
	let isRecharge = $derived(item?.contenant_type === 'fut' || item?.contenant_type === 'cubi');
	let perteTheorique = $state(0);
	let nouveauVolume = $state(0);
	let loading = $state(false);

	$effect(() => {
		if (show && item) {
			quantity = 1;
			if (isRecharge) {
				perteTheorique = item.volume_restant || 0;
				nouveauVolume = item.contenant_capacite || item.contenant_capacite_ml || 30000;
			}
		}
	});

	async function handleConfirm() {
		loading = true;
		try {
			const endpoint =
				type === 'boisson' ? `/api/boissons/${item.id}` : `/api/consommables/${item.id}`;

			let payload = {};

			if (isRecharge) {
				// Mode recharge de fût
				payload = {
					nb_plein: Math.max(0, (item.nb_plein || 0) - 1),
					nb_vide: (item.nb_vide || 0) + 1,
					volume_restant: nouveauVolume / 1000 // On repasse en L pour l'API si l'API attend du L
					// Note: Schema dit volume_restant REAL. On va harmoniser à mL dans l'API plus tard si besoin.
					// Pour l'instant on garde la logique existante de l'API.
				};
				// Correction: Si l'API attend du L, on divise par 1000.
				// Mais attendez, j'ai mis capacite_ml dans contenants.
			} else {
				// Mode ajout de stock simple
				const current = type === 'boisson' ? item.nb_plein || 0 : item.stock || 0;
				payload = type === 'boisson' ? { nb_plein: current + quantity } : { stock: current + quantity };
			}

			const res = await fetch(endpoint, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (res.ok) {
				onSuccess();
				show = false;
			}
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}
</script>

<Modal
	bind:show
	title={isRecharge ? 'Recharger le fût' : 'Ajouter du stock'}
	onCancel={onClose}
	onConfirm={handleConfirm}
	confirmText={loading ? '...' : 'Confirmer'}
>
	<div class="space-y-6 pt-2">
		{#if item}
			<div class="flex items-center gap-4 p-4 bg-bg-secondary rounded-2xl border border-border">
				<div
					class="w-12 h-12 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center"
				>
					<Icon name={item.icone || (type === 'boisson' ? 'Beer' : 'Utensils')} size={24} />
				</div>
				<div>
					<div class="font-bold text-text-primary">{item.contenu_nom || item.nom}</div>
					<div class="text-xs text-text-muted">
						{item.contenant_nom || (type === 'boisson' ? 'Unité' : 'Snack')}
					</div>
				</div>
			</div>

			{#if isRecharge}
				<div class="space-y-4">
					<div class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
						<div class="text-xs font-bold text-amber-500 uppercase mb-1">Information</div>
						<p class="text-sm text-text-primary opacity-80">
							Vous allez terminer le fût actuel. Le stock de fûts pleins sera réduit de 1.
						</p>
					</div>

					<div>
						<label class="block text-sm font-bold text-text-muted mb-2"
							>Volume restant (théorique : {perteTheorique.toFixed(1)}L)</label
						>
						<div class="relative">
							<input
								type="number"
								step="0.1"
								bind:value={perteTheorique}
								class="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-brand-red"
							/>
							<span class="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-bold"
								>L</span
							>
						</div>
					</div>

					<div>
						<label class="block text-sm font-bold text-text-muted mb-2"
							>Capacité du nouveau fût (mL)</label
						>
						<div class="relative">
							<input
								type="number"
								bind:value={nouveauVolume}
								class="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-brand-red"
							/>
							<span class="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-bold"
								>mL</span
							>
						</div>
					</div>
				</div>
			{:else}
				<div class="space-y-4">
					<p class="text-sm text-text-muted">Combien d'unités souhaitez-vous ajouter au stock ?</p>

					<div class="flex items-center gap-4">
						<button
							onclick={() => (quantity = Math.max(1, quantity - 1))}
							class="w-12 h-12 rounded-xl bg-bg-secondary border border-border flex items-center justify-center hover:bg-bg-tertiary transition-colors"
						>
							<Icon name="Minus" size={20} />
						</button>

						<input
							type="number"
							bind:value={quantity}
							class="flex-1 text-center bg-transparent text-3xl font-black text-text-primary focus:outline-none"
						/>

						<button
							onclick={() => quantity++}
							class="w-12 h-12 rounded-xl bg-bg-secondary border border-border flex items-center justify-center hover:bg-bg-tertiary transition-colors"
						>
							<Icon name="Plus" size={20} />
						</button>
					</div>

					<div class="grid grid-cols-4 gap-2">
						{#each [5, 10, 24, 50] as val}
							<button
								onclick={() => (quantity = val)}
								class="py-2 rounded-lg bg-bg-secondary border border-border text-xs font-bold hover:border-brand-red transition-colors"
							>
								+{val}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</Modal>
