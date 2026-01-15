<script lang="ts">
	import Modal from './Modal.svelte';
	import Icon from './Icon.svelte';
	import type { Boisson, Consommable } from '$lib/types';

	interface Props {
		show: boolean;
		item: any; // Using any for now as Boisson/Consommable structures are diverse in joined queries
		type: 'boisson' | 'consommable';
		onClose: () => void;
		onSuccess?: () => void;
	}

	let { show = $bindable(false), item, type, onClose, onSuccess }: Props = $props();

	let formData = $state({
		nom: '',
		prix_vente: 0,
		quantite: 0,
		unite: 'unite' as 'unite' | 'volume',
		dose_ml: 0,
		icone: 'Beer',
		description: ''
	});

	const iconesBoissons = [
		'Beer', 'Wine', 'Coffee', 'CupSoda',
		'Droplet', 'GlassWater', 'Milk', 'Flame'
	];

	const iconesConsommables = [
		'Pizza', 'Sandwich', 'Cookie', 'Beef', 
		'Cherry', 'Carrot', 'Apple', 'Utensils',
        'Salad', 'Fish', 'CookingPot', 'Candy', 'Croissant', 'CakeSlice'
	];

	// Initialize form when item changes
	$effect(() => {
		if (show && item) {
			if (type === 'boisson') {
				formData = {
					nom: item.contenu_nom || item.nom || '',
					prix_vente: item.prix_vente || 0,
					quantite: item.nb_plein || 0,
					unite: item.contenant_type === 'fut' || item.contenant_type === 'cubi' ? 'volume' : 'unite',
					dose_ml: item.contenant_capacite ? Math.round(item.contenant_capacite * 1000) : 250,
					icone: item.icone || 'Beer',
					description: item.description || ''
				};
			} else {
				formData = {
					nom: item.nom || '',
					prix_vente: item.prix_vente || 0,
					quantite: item.stock || item.nb || 0,
					unite: 'unite',
					dose_ml: 0,
					icone: item.icone || 'Utensils',
					description: item.description || ''
				};
			}
		}
	});

	async function handleSave() {
		if (!item) return;

		try {
			const endpoint = type === 'boisson' 
				? `/api/boissons/${item.id}`
				: `/api/consommables/${item.id}`;

			const payload = type === 'boisson' ? {
				prix_vente: formData.prix_vente,
				nb_plein: formData.quantite,
				icone: formData.icone,
				description: formData.description
			} : {
				prix_vente: formData.prix_vente,
				stock: formData.quantite,
				icone: formData.icone,
				nom: formData.nom,
				description: formData.description
			};

			const res = await fetch(endpoint, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (res.ok) {
				if (onSuccess) onSuccess();
				show = false;
			} else {
				console.error('Erreur lors de la sauvegarde');
				alert('Erreur lors de la sauvegarde');
			}
		} catch (e) {
			console.error(e);
			alert('Erreur lors de la sauvegarde');
		}
	}
</script>

<Modal 
	bind:show 
	title={`Modifier ${type === 'boisson' ? 'la boisson' : 'le consommable'}`}
	onCancel={onClose}
	onConfirm={handleSave}
	confirmText="Enregistrer"
>
	<div class="space-y-4 p-1">
		<!-- Nom -->
		<div>
			<label for="edit-nom" class="block text-sm font-bold text-text-muted mb-2">Nom</label>
			<input
				id="edit-nom"
				type="text"
				bind:value={formData.nom}
				class="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-white/5 text-text-primary focus:outline-none focus:border-brand-red transition-colors"
			/>
		</div>

		<!-- Description -->
		<div>
			<div class="flex justify-between items-center mb-2">
				<label for="edit-desc" class="block text-sm font-bold text-text-muted">Sous-titre / Description (optionnel)</label>
				{#if formData.description}
					<button
						onclick={() => (formData.description = '')}
						class="text-xs text-brand-red hover:underline"
					>
						Effacer
					</button>
				{/if}
			</div>
			<input
				id="edit-desc"
				type="text"
				bind:value={formData.description}
				placeholder="Ex: Pinte 50cL, Blonde 5°, etc."
				class="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-white/5 text-text-primary focus:outline-none focus:border-brand-red transition-colors"
			/>
		</div>

		<!-- Prix de vente -->
		<div>
			<label for="edit-prix" class="block text-sm font-bold text-text-muted mb-2">Prix de vente (€)</label>
			<input
				id="edit-prix"
				type="number"
				step="0.1"
				bind:value={formData.prix_vente}
				class="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-white/5 text-text-primary focus:outline-none focus:border-brand-red transition-colors"
			/>
		</div>

		<!-- Quantité -->
		<div>
			<label for="edit-quantite" class="block text-sm font-bold text-text-muted mb-2">
				{formData.unite === 'volume' ? 'Quantité (L)' : 'Quantité (unités)'}
			</label>
			<input
				id="edit-quantite"
				type="number"
				bind:value={formData.quantite}
				class="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-white/5 text-text-primary focus:outline-none focus:border-brand-red transition-colors"
			/>
		</div>

		{#if type === 'boisson'}
			<!-- Type d'unité -->
			<div>
				<span class="block text-sm font-bold text-text-muted mb-2">Type</span>
				<div class="flex gap-4">
					<button
						onclick={() => (formData.unite = 'unite')}
						class="flex-1 py-3 rounded-xl border transition-all {formData.unite === 'unite'
							? 'bg-brand-red text-white border-brand-red'
							: 'bg-bg-secondary text-text-muted border-white/5'}"
					>
						Unité (canette, bouteille...)
					</button>
					<button
						onclick={() => (formData.unite = 'volume')}
						class="flex-1 py-3 rounded-xl border transition-all {formData.unite === 'volume'
							? 'bg-brand-red text-white border-brand-red'
							: 'bg-bg-secondary text-text-muted border-white/5'}"
					>
						Volume (fût, pression...)
					</button>
				</div>
			</div>

			<!-- Dose (si volume) -->
			{#if formData.unite === 'volume'}
				<div>
					<label for="edit-dose" class="block text-sm font-bold text-text-muted mb-2">Dose par service (mL)</label>
					<input
						id="edit-dose"
						type="number"
						bind:value={formData.dose_ml}
						placeholder="250"
						class="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-white/5 text-text-primary focus:outline-none focus:border-brand-red transition-colors"
					/>
				</div>
			{/if}
		{/if}

		<!-- Sélecteur d'icône -->
		<div>
			<span class="block text-sm font-bold text-text-muted mb-2">Icône</span>
			<div class="grid grid-cols-5 gap-2">
				{#each type === 'boisson' ? iconesBoissons : iconesConsommables as iconName}
					<button
						onclick={() => (formData.icone = iconName)}
						class="p-4 rounded-xl border transition-all {formData.icone === iconName
							? 'bg-brand-red text-white border-brand-red'
							: 'bg-bg-secondary text-text-muted border-white/5 hover:border-white/10'}"
						title={iconName}
					>
						<!-- We need to dynamically import Icon or passed as slot if using dynamic name. 
                             However Icon.svelte handles 'name' prop. So we just need to import Icon component in this file?
                             Yes, but I cannot use <Icon> here if I haven't imported it. I didn't import it in the script above. -->
                        <div class="flex items-center justify-center">
                            <Icon name={iconName} size={24} />
                        </div>
					</button>
				{/each}
			</div>
		</div>
	</div>
</Modal>
