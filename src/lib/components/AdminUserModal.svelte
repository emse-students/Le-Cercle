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
			const res = await fetch(`/api/users/${editingUser.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					role: editingUser.role,
					statut_cotisation: editingUser.statut_cotisation,
					solde: editingUser.solde
				})
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
	onCancel={handleCancel}
	onConfirm={handleSave}
	confirmText="Enregistrer"
	cancelText="Annuler"
	confirmDisabled={loading}
>
	{#if editingUser}
		<div class="space-y-6">
			<!-- Nom complet -->
			<div>
				<span class="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
					Utilisateur
				</span>
				<div class="text-lg font-bold text-text-primary">
					{editingUser.prenom} {editingUser.nom}
				</div>
				<div class="text-sm text-text-muted">{editingUser.login} · {editingUser.mail}</div>
			</div>

			<!-- Rôle -->
			<div>
				<label for="role-select" class="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
					Rôle
				</label>
				<select 
					id="role-select"
					bind:value={editingUser.role}
					class="w-full bg-bg-secondary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-brand-red transition-colors"
				>
					<option value="user">Utilisateur</option>
					<option value="cercleux">Cercleux (Admin)</option>
				</select>
			</div>

			<!-- Statut cotisation -->
			<div>
				<label for="statut-select" class="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
					Statut Cotisation
				</label>
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

			<!-- Solde -->
			<div>
				<label for="solde-input" class="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
					Solde (€)
				</label>
				<input 
					id="solde-input"
					type="number"
					step="0.01"
					bind:value={editingUser.solde}
					class="w-full bg-bg-secondary border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-brand-red transition-colors font-mono"
				/>
			</div>
		</div>
	{/if}
</Modal>
