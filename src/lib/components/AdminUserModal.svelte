<script lang="ts">
	import Modal from './Modal.svelte';
	import type { User } from '$lib/types';

	interface Props {
		show: boolean;
		user: User | null; // null if creating
		onClose: () => void;
		onSuccess?: () => void;
	}

	let { show = $bindable(false), user, onClose, onSuccess }: Props = $props();

	let editingUser = $state<Partial<User>>({});
	let loading = $state(false);

	$effect(() => {
		if (show) {
			if (user) {
				editingUser = { ...user };
			} else {
				editingUser = {
					login: '',
					prenom: '',
					nom: '',
					promo: new Date().getFullYear(),
					role: 'user',
					statut_cotisation: 'non_cotisant',
					solde: 0.0,
					mail: ''
				};
			}
		}
	});

	async function handleSave() {
		loading = true;

		try {
			const isEdit = !!user;
			const endpoint = isEdit ? `/api/users/${user.id}` : `/api/users`;
			const method = isEdit ? 'PATCH' : 'POST';

			const res = await fetch(endpoint, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(editingUser)
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || 'Erreur lors de la sauvegarde');
			}

			if (onSuccess) onSuccess();
			show = false;
		} catch (err) {
			console.error('Erreur sauvegarde user:', err);
			alert(err instanceof Error ? err.message : 'Erreur réseau');
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		onClose();
	}
</script>

<Modal
	bind:show
	title={user ? "Modifier l'utilisateur" : 'Nouveau membre'}
	wide={true}
	onCancel={handleCancel}
	onConfirm={handleSave}
	confirmText={user ? 'Enregistrer' : 'Créer'}
	cancelText="Annuler"
	confirmDisabled={loading}
>
	<div class="space-y-6">
		{#if !user}
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label
						for="new-login"
						class="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Login</label
					>
					<input
						id="new-login"
						type="text"
						bind:value={editingUser.login}
						class="w-full bg-bg-secondary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-brand-red transition-colors"
						placeholder="j.doe"
					/>
				</div>
				<div>
					<label
						for="new-promo"
						class="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Promo</label
					>
					<input
						id="new-promo"
						type="number"
						bind:value={editingUser.promo}
						class="w-full bg-bg-secondary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-brand-red transition-colors"
					/>
				</div>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label
						for="new-prenom"
						class="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Prénom</label
					>
					<input
						id="new-prenom"
						type="text"
						bind:value={editingUser.prenom}
						class="w-full bg-bg-secondary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-brand-red transition-colors"
					/>
				</div>
				<div>
					<label
						for="new-nom"
						class="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Nom</label
					>
					<input
						id="new-nom"
						type="text"
						bind:value={editingUser.nom}
						class="w-full bg-bg-secondary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-brand-red transition-colors"
					/>
				</div>
			</div>
			<div>
				<label
					for="new-mail"
					class="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Mail</label
				>
				<input
					id="new-mail"
					type="email"
					bind:value={editingUser.mail}
					class="w-full bg-bg-secondary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-brand-red transition-colors"
					placeholder="john.doe@etu.emse.fr"
				/>
			</div>
		{:else}
			<div>
				<span class="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2"
					>Utilisateur</span
				>
				<div class="text-lg font-bold text-text-primary">{editingUser.prenom} {editingUser.nom}</div>
				<div class="text-sm text-text-muted">{editingUser.login} · {editingUser.mail}</div>
			</div>
		{/if}

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label
					for="role-select"
					class="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Rôle</label
				>
				<select
					id="role-select"
					bind:value={editingUser.role}
					class="w-full bg-bg-secondary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-brand-red transition-colors"
				>
					<option value="user">Utilisateur</option>
					<option value="cercleux">Cercleux (Admin)</option>
				</select>
			</div>
			<div>
				<label
					for="statut-select"
					class="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2"
					>Statut Cotisation</label
				>
				<select
					id="statut-select"
					bind:value={editingUser.statut_cotisation}
					class="w-full bg-bg-secondary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-brand-red transition-colors"
				>
					<option value="non_cotisant">Non cotisant</option>
					<option value="cotisant_sans_alcool">Cotisant sans alcool</option>
					<option value="cotisant_avec_alcool">Cotisant avec alcool</option>
				</select>
			</div>
		</div>

		<div>
			<label
				for="solde-input"
				class="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Solde (€)</label
			>
			<input
				id="solde-input"
				type="number"
				step="0.01"
				bind:value={editingUser.solde}
				class="w-full bg-bg-secondary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-brand-red transition-colors font-mono"
			/>
		</div>
	</div>
</Modal>
