<script lang="ts">
	import Modal from './Modal.svelte';
	import Icon from './Icon.svelte';
	import { onMount } from 'svelte';

	interface Props {
		show: boolean;
		item: any; // null if creating
		type: 'boisson' | 'consommable';
		onClose: () => void;
		onSuccess?: () => void;
	}

	let { show = $bindable(false), item, type, onClose, onSuccess }: Props = $props();

	let formData = $state({
		nom: '',
		prix_vente: 0,
		prix_achat: 0,
		quantite: 0,
		unite: 'unite' as 'unite' | 'volume',
		dose_ml: 0,
		volume_ml: 0,
		icone: 'Beer',
		description: '',
		// Boisson specific creation
		id_contenu: null as number | null,
		id_contenant: null as number | null
	});

	let config = $state<{ contenus: any[]; contenants: any[] }>({ contenus: [], contenants: [] });
	let loadingConfig = $state(false);

	const iconesBoissons = [
		'Beer',
		'Wine',
		'Coffee',
		'CupSoda',
		'Droplet',
		'GlassWater',
		'Milk',
		'Flame'
	];
	const iconesConsommables = [
		'Pizza',
		'Sandwich',
		'Cookie',
		'Beef',
		'Cherry',
		'Carrot',
		'Apple',
		'Utensils',
		'Salad',
		'Fish',
		'CookingPot',
		'Candy',
		'Croissant',
		'CakeSlice'
	];

	async function loadConfig() {
		if (type !== 'boisson') return;
		loadingConfig = true;
		try {
			const res = await fetch('/api/config/items');
			if (res.ok) config = await res.json();
		} catch (e) {
			console.error(e);
		} finally {
			loadingConfig = false;
		}
	}

	$effect(() => {
		if (show) {
			if (item) {
				// EDIT Mode
				if (type === 'boisson') {
					formData = {
						nom: item.contenu_nom || item.nom || '',
						prix_vente: item.prix_vente || 0,
						prix_achat: item.prix_achat || 0,
						quantite: item.nb_plein || 0,
						unite: item.contenant_type === 'fut' || item.contenant_type === 'cubi' ? 'volume' : 'unite',
						dose_ml: item.contenant_capacite || item.contenant_capacite_ml || 250,
						volume_ml: 0,
						icone: item.icone || 'Beer',
						description: item.description || '',
						id_contenu: item.id_contenu,
						id_contenant: item.id_contenant
					};
				} else {
					formData = {
						nom: item.nom || '',
						prix_vente: item.prix_vente || 0,
						prix_achat: item.prix_achat || 0,
						quantite: item.stock || item.nb || 0,
						unite: 'unite',
						dose_ml: 0,
						volume_ml: item.volume_ml || 0,
						icone: item.icone || 'Utensils',
						description: item.description || '',
						id_contenu: null,
						id_contenant: null
					};
				}
			} else {
				// CREATE Mode
				formData = {
					nom: '',
					prix_vente: 0,
					prix_achat: 0,
					quantite: 0,
					unite: type === 'boisson' ? 'unite' : 'unite',
					dose_ml: 250,
					volume_ml: 0,
					icone: type === 'boisson' ? 'Beer' : 'Utensils',
					description: '',
					id_contenu: null,
					id_contenant: null
				};
				loadConfig();
			}
		}
	});

	async function handleSave() {
		try {
			const isEdit = !!item;
			let endpoint = '';
			let method = isEdit ? 'PATCH' : 'POST';

			if (isEdit) {
				endpoint = type === 'boisson' ? `/api/boissons/${item.id}` : `/api/consommables/${item.id}`;
			} else {
				endpoint = '/api/items'; // Use generic endpoint for creation
			}

			let payload: any = {
				prix_vente: formData.prix_vente,
				prix_achat: formData.prix_achat,
				icone: formData.icone,
				description: formData.description
			};

			if (type === 'boisson') {
				payload.nb_plein = formData.quantite;
				payload.dose_ml = formData.dose_ml;
				if (!isEdit) {
					payload.type = 'boisson';
					payload.id_contenu = formData.id_contenu;
					payload.id_contenant = formData.id_contenant;
				}
			} else {
				payload.stock = formData.quantite;
				payload.nom = formData.nom;
				payload.volume_ml = formData.volume_ml;
				if (!isEdit) {
					payload.type = 'consommable';
				}
			}

			const res = await fetch(endpoint, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (res.ok) {
				if (onSuccess) onSuccess();
				show = false;
			} else {
				const err = await res.json();
				alert(err.error || 'Erreur lors de la sauvegarde');
			}
		} catch (e) {
			console.error(e);
			alert('Erreur réseau');
		}
	}

	async function handleDelete() {
		if (!item) return;
		if (!confirm(`Supprimer définitivement cet item de la carte ?`)) return;

		try {
			const res = await fetch(
				`/api/items?id=${item.id}&type=${type === 'boisson' ? 'boisson' : 'consommable'}`,
				{
					method: 'DELETE'
				}
			);

			if (res.ok) {
				if (onSuccess) onSuccess();
				show = false;
			} else {
				const err = await res.json();
				alert(err.error || 'Erreur lors de la suppression');
			}
		} catch (e) {
			alert('Erreur réseau');
		}
	}
</script>

<Modal
	bind:show
	title={item
		? `Modifier ${type === 'boisson' ? 'la boisson' : 'le consommable'}`
		: `Ajouter un ${type === 'boisson' ? 'une boisson' : 'un snack'}`}
	onCancel={onClose}
	onConfirm={handleSave}
	confirmText="Enregistrer"
>
	<div class="space-y-4 p-1">
		{#if !item && type === 'boisson'}
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="select-contenu" class="block text-sm font-bold text-text-muted mb-2"
						>Contenu (ex: Chouffe)</label
					>
					<select
						id="select-contenu"
						bind:value={formData.id_contenu}
						class="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-brand-red"
					>
						<option value={null}>Choisir...</option>
						{#each config.contenus as c}
							<option value={c.id}>{c.nom} ({c.degre || 0}°)</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="select-contenant" class="block text-sm font-bold text-text-muted mb-2"
						>Contenant (ex: Pinte)</label
					>
					<select
						id="select-contenant"
						bind:value={formData.id_contenant}
						class="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-brand-red"
					>
						<option value={null}>Choisir...</option>
						{#each config.contenants as c}
							<option value={c.id}>{c.nom} ({c.capacite_ml || 0}mL)</option>
						{/each}
					</select>
				</div>
			</div>
		{:else if type === 'consommable'}
			<div>
				<label for="manage-nom" class="block text-sm font-bold text-text-muted mb-2">Nom</label>
				<input
					id="manage-nom"
					type="text"
					bind:value={formData.nom}
					class="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-brand-red transition-colors"
				/>
			</div>
		{/if}

		<div>
			<label for="manage-desc" class="block text-sm font-bold text-text-muted mb-2"
				>Sous-titre / Description (optionnel)</label
			>
			<input
				id="manage-desc"
				type="text"
				bind:value={formData.description}
				placeholder="Ex: Pinte 50cL, Blonde 5°, etc."
				class="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-brand-red transition-colors"
			/>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="manage-prix" class="block text-sm font-bold text-text-muted mb-2"
					>Prix de vente (€)</label
				>
				<input
					id="manage-prix"
					type="number"
					step="0.1"
					bind:value={formData.prix_vente}
					class="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-brand-red"
				/>
			</div>
			<div>
				<label for="manage-prix-achat" class="block text-sm font-bold text-text-muted mb-2"
					>Prix d'achat (€)</label
				>
				<input
					id="manage-prix-achat"
					type="number"
					step="0.1"
					bind:value={formData.prix_achat}
					class="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-brand-red"
				/>
			</div>
		</div>

		<div>
			<label for="manage-qty" class="block text-sm font-bold text-text-muted mb-2"
				>Stock initial / actuel</label
			>
			<input
				id="manage-qty"
				type="number"
				bind:value={formData.quantite}
				class="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-brand-red"
			/>
		</div>

		{#if type === 'boisson'}
			<!-- Dose selection if existing item or new drink -->
			<div>
				<label for="manage-dose" class="block text-sm font-bold text-text-muted mb-2"
					>Contenance (mL)</label
				>
				<input
					id="manage-dose"
					type="number"
					bind:value={formData.dose_ml}
					class="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-brand-red"
				/>
			</div>
		{:else}
			<div>
				<label for="manage-vol" class="block text-sm font-bold text-text-muted mb-2"
					>Volume (mL - si liquide)</label
				>
				<input
					id="manage-vol"
					type="number"
					bind:value={formData.volume_ml}
					class="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary focus:outline-none focus:border-brand-red"
				/>
			</div>
		{/if}

		<div>
			<span class="block text-sm font-bold text-text-muted mb-2">Icône</span>
			<div class="grid grid-cols-5 gap-2">
				{#each type === 'boisson' ? iconesBoissons : iconesConsommables as iconName}
					<button
						onclick={() => (formData.icone = iconName)}
						class="p-4 rounded-xl border transition-all {formData.icone === iconName
							? 'bg-brand-red text-white border-brand-red'
							: 'bg-bg-secondary text-text-muted border-border hover:border-text-muted'}"
					>
						<div class="flex items-center justify-center">
							<Icon name={iconName} size={24} />
						</div>
					</button>
				{/each}
			</div>
		</div>

		{#if item}
			<div class="pt-6 mt-6 border-t border-border flex justify-end">
				<button
					onclick={handleDelete}
					class="flex items-center gap-2 px-4 py-2 text-error hover:bg-error/10 rounded-lg transition-colors font-bold text-sm"
				>
					<Icon name="Trash2" size={16} />
					Supprimer de la carte
				</button>
			</div>
		{/if}
	</div>
</Modal>
