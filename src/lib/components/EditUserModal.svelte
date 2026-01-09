<script lang="ts">
	import Modal from './Modal.svelte';
	import type { User } from '$lib/types';

	interface Props {
		show: boolean;
		user: User | null;
		onClose: () => void;
		onSuccess?: () => void;
	}

	let { show = $bindable(false), user, onClose, onSuccess }: Props = $props();

	let editingUser = $state<User | null>(null);
	let loading = $state(false);

	// Synchroniser editingUser avec user quand la modal s'ouvre
	$effect(() => {
		if (show && user) {
			editingUser = { ...user };
		}
	});

	async function handleSave() {
		if (!editingUser) return;

		loading = true;

		try {
			const res = await fetch('/api/users', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(editingUser)
			});

			if (!res.ok) {
				const error = await res.json();
				throw new Error(error.error || 'Erreur lors de la modification');
			}

			if (onSuccess) {
				onSuccess();
			}
			show = false;
		} catch (err) {
			console.error('Erreur modification user:', err);
			alert(err instanceof Error ? err.message : 'Erreur réseau');
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		editingUser = null;
		onClose();
	}
</script>

<Modal
	bind:show
	title="Modifier l'utilisateur"
	wide={true}
	hideActions={true}
	onCancel={handleCancel}
>
	{#if editingUser}
		<div class="space-y-4">
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium text-text-secondary mb-2">Prénom</label>
					<input
						type="text"
						bind:value={editingUser.prenom}
						class="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-text-secondary mb-2">Nom</label>
					<input
						type="text"
						bind:value={editingUser.nom}
						class="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red"
					/>
				</div>
			</div>

			<div>
				<label for="edit-prenom" class="block text-sm font-medium text-text-secondary mb-2">Prénom</label>
				<input
					id="edit-prenom"
					type="text"
					bind:value={editingUser.login}
					class="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-brand-red"
				/>
			</div>

			<div>
				<label class="block text-sm font-medium text-text-secondary mb-2">Email</label>
				<input
					type="email"
					bind:value={editingUser.mail}
					class="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-brand-red"
				/>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium text-text-secondary mb-2">Promo</label>
					<input
						type="number"
						bind:value={editingUser.promo}
						class="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-text-secondary mb-2">Solde (€)</label>
					<input
						type="number"
						step="0.01"
						bind:value={editingUser.solde}
						class="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-brand-red"
					/>
				</div>
			</div>

			<div>
				<label class="block text-sm font-medium text-text-secondary mb-2">Rôle</label>
				<select
					bind:value={editingUser.role}
					class="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red"
				>
					<option value="user">Utilisateur</option>
					<option value="cercleux">Cercleux</option>
				</select>
			</div>

			<div>
				<label class="block text-sm font-medium text-text-secondary mb-2"
					>Statut de cotisation</label
				>
				<select
					bind:value={editingUser.statut_cotisation}
					class="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red"
				>
					<option value="non_cotisant">Non cotisant</option>
					<option value="cotisant_sans_alcool">Cotisant sans alcool</option>
					<option value="cotisant_avec_alcool">Cotisant avec alcool</option>
				</select>
			</div>

			<div class="flex justify-end gap-3 pt-4 border-t border-border">
				<button
					type="button"
					onclick={handleCancel}
					disabled={loading}
					class="px-4 py-2 border border-border rounded-lg text-text-secondary hover:bg-bg-tertiary disabled:opacity-50"
				>
					Annuler
				</button>
				<button
					type="button"
					onclick={handleSave}
					disabled={loading}
					class="px-4 py-2 bg-brand-red text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
				>
					{loading ? 'Enregistrement...' : 'Enregistrer'}
				</button>
			</div>
		</div>
	{/if}
</Modal>
