<script lang="ts">
   import { onMount } from 'svelte';
   import Icon from '$lib/components/Icon.svelte';
   import UserSearch from '$lib/components/UserSearch.svelte';
   import EditUserModal from '$lib/components/EditUserModal.svelte';
   import ConfirmModal from '$lib/components/ConfirmModal.svelte';

   let activeTab = $state('users');
   let users = $state<any[]>([]);
   let perms = $state<any[]>([]);
   let boissons = $state<any[]>([]);
   let loading = $state(false);
   let message = $state({ type: '', text: '' });
   
   // Recharge
   let selectedUserForRecharge = $state<any>(null);
   let rechargeAmount = $state<number | ''>('');
   let customAmount = $state(false);
   
   // Create perm
   let newPermName = $state('');
   let newPermAnnee = $state(new Date().getFullYear().toString());
   
   // Create user
   let newUserPrenom = $state('');
   let newUserNom = $state('');
   let newUserPromo = $state(new Date().getFullYear());
   let newUserRole = $state('user');
   let newUserStatut = $state('non_cotisant');
   
   // Computed login/mail
   let newUserLogin = $derived(newUserPrenom && newUserNom ? `${newUserPrenom.toLowerCase()}.${newUserNom.toLowerCase()}` : '');
   let newUserMail = $derived(newUserLogin ? `${newUserLogin}@etu.emse.fr` : '');
   
   // Edit user modal
   let editingUser = $state<any>(null);
   let showEditModal = $state(false);
   
   // Delete user confirmation
   let deletingUser = $state<any>(null);
   let showDeleteConfirm = $state(false);
   
   // Config cotisations
   let cotisationSansAlcool = $state(10.0);
   let cotisationAvecAlcool = $state(20.0);
   
   onMount(async () => {
       await loadUsers();
       await loadPerms();
   });
   
   async function loadUsers() {
       try {
           const res = await fetch('/api/users');
           if (res.ok) {
               users = await res.json();
           }
       } catch (err) {
           console.error('Erreur chargement users:', err);
       }
   }
   
   async function loadPerms() {
       try {
           const res = await fetch('/api/perms');
           if (res.ok) {
               perms = await res.json();
           }
       } catch (err) {
           console.error('Error loading perms:', err);
       }
   }
   
   async function handleRecharge() {
       if (!selectedUserForRecharge || !rechargeAmount) return;
       
       loading = true;
       message = { type: '', text: '' };
       
       try {
           const res = await fetch('/api/recharge', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                   userId: selectedUserForRecharge.id,
                   amount: Number(rechargeAmount)
               })
           });
           
           if (res.ok) {
               const data = await res.json();
               message = { type: 'success', text: `Compte rechargé de ${rechargeAmount}€ (nouveau solde: ${data.newSolde.toFixed(2)}€)` };
               selectedUserForRecharge = null;
               rechargeAmount = '';
           } else {
               const error = await res.json();
               message = { type: 'error', text: error.error };
           }
       } catch (err) {
           message = { type: 'error', text: 'Erreur réseau' };
       } finally {
           loading = false;
       }
   }
   
   async function createPerm() {
       if (!newPermName || !newPermAnnee) return;
       
       loading = true;
       message = { type: '', text: '' };
       
       try {
           const res = await fetch('/api/perms', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                   nom: newPermName,
                   annee: newPermAnnee
               })
           });
           
           if (res.ok) {
               message = { type: 'success', text: 'Perm créée avec succès' };
               newPermName = '';
               await loadPerms();
           } else {
               const error = await res.json();
               message = { type: 'error', text: error.error };
           }
       } catch (err) {
           message = { type: 'error', text: 'Erreur réseau' };
       } finally {
           loading = false;
       }
   }
   
   async function togglePerm(permId: number, isOpen: boolean) {
       loading = true;
       
       try {
           const res = await fetch('/api/perms', {
               method: 'PATCH',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                   permId,
                   action: isOpen ? 'close' : 'open'
               })
           });
           
           if (res.ok) {
               await loadPerms();
           }
       } catch (err) {
           console.error('Error toggling perm:', err);
       } finally {
           loading = false;
       }
   }
   
   async function deletePerm(permId: number) {
       if (!confirm('Êtes-vous sûr de vouloir supprimer cette perm ?')) return;
       
       loading = true;
       
       try {
           const res = await fetch(`/api/perms?id=${permId}`, {
               method: 'DELETE'
           });
           
           if (res.ok) {
               message = { type: 'success', text: 'Perm supprimée' };
               await loadPerms();
           } else {
               const error = await res.json();
               message = { type: 'error', text: error.error || 'Erreur lors de la suppression' };
           }
       } catch (err) {
           message = { type: 'error', text: 'Erreur lors de la suppression' };
       } finally {
           loading = false;
       }
   }
   
   async function createUser() {
       if (!newUserLogin || !newUserPrenom || !newUserNom || !newUserPromo) return;
       
       loading = true;
       message = { type: '', text: '' };
       
       try {
           const res = await fetch('/api/users', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                   login: newUserLogin,
                   prenom: newUserPrenom,
                   nom: newUserNom,
                   promo: newUserPromo,
                   role: newUserRole,
                   statut_cotisation: newUserStatut
               })
           });
           
           if (res.ok) {
               message = { type: 'success', text: 'Utilisateur créé avec succès' };
               newUserPrenom = '';
               newUserNom = '';
               newUserPromo = new Date().getFullYear();
               newUserRole = 'user';
               newUserStatut = 'non_cotisant';
               await loadUsers();
           } else {
               const error = await res.json();
               message = { type: 'error', text: error.error };
           }
       } catch (err) {
           message = { type: 'error', text: 'Erreur réseau' };
       } finally {
           loading = false;
       }user;
       showEditModal = true;
   }
   
   function closeEditModal() {
       editingUser = null;
       showEditModal = false;
   }
   
   async function handleEditSuccess() {
       message = { type: 'success', text: 'Utilisateur modifié avec succès' };
       await loadUsers();
   }
   
   function openDeleteConfirm(user: any) {
       deletingUser = user;
       showDeleteConfirm = true;
   }
   
   function closeDeleteConfirm() {
       deletingUser = null;
       showDeleteConfirm = false;
   }
   
   async function handleDeleteConfirm() {
       if (!deletingUser) return;
       
       loading = true;
       message = { type: '', text: '' };
       
       try {
           const res = await fetch(`/api/users?id=${deletingUser.id}`, {
               method: 'DELETE'
           });
           
           if (res.ok) {
               message = { type: 'success', text: 'Utilisateur supprimé' };
               await loadUsers();
               closeDeleteConfirm
           
           if (res.ok) {
               message = { type: 'success', text: 'Utilisateur supprimé' };
               await loadUsers();
           } else {
               const error = await res.json();
               message = { type: 'error', text: error.error };
           }
       } catch (err) {
           message = { type: 'error', text: 'Erreur réseau' };
       } finally {
           loading = false;
       }
   }
</script>

<div class="max-w-7xl mx-auto p-4 md:p-8">
   <h1 class="text-3xl font-bold mb-8 text-text-primary">Administration</h1>
   
   {#if message.text}
       <div class="mb-6 p-4 rounded-lg {message.type === 'success' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'}">
           {message.text}
       </div>
   {/if}

   <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
       <!-- Sidebar Menu -->
       <div class="lg:col-span-1 space-y-2">
           {#each [
               { id: 'users', label: 'Utilisateurs', icon: 'Users' },
               { id: 'perms', label: 'Perms', icon: 'Calendar' },
               { id: 'recharge', label: 'Recharge', icon: 'CreditCard' },
               { id: 'boissons', label: 'Boissons', icon: 'Beer' },
               { id: 'consommables', label: 'Consommables', icon: 'Cookie' }
           ] as tab}
               <button 
                   onclick={() => activeTab = tab.id}
                   class="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors font-medium
                   {activeTab === tab.id ? 'bg-brand-red text-white' : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary hover:text-text-primary'}"
               >
                   <Icon name={tab.icon} size={18} />
                   {tab.label}
               </button>
           {/each}
       </div>

       <!-- Content Area -->
       <div class="lg:col-span-3 bg-bg-secondary rounded-lg border border-border p-6">
           
           {#if activeTab === 'users'}
               <h2 class="text-2xl font-bold mb-6 text-text-primary">Gestion des utilisateurs</h2>
               
               <!-- Formulaire création utilisateur -->
               <div class="bg-bg-tertiary rounded-lg p-4 mb-6">
                   <h3 class="text-lg font-semibold mb-4 text-text-primary">Créer un utilisateur</h3>
                   <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                           <label for="new-prenom" class="block text-sm font-medium text-text-secondary mb-2">Prénom</label>
                           <input id="new-prenom" type="text" bind:value={newUserPrenom} placeholder="Lucas" class="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg" />
                       </div>
                       <div>
                           <label for="new-nom" class="block text-sm font-medium text-text-secondary mb-2">Nom</label>
                           <input id="new-nom" type="text" bind:value={newUserNom} placeholder="Dupont" class="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg" />
                       </div>
                       <div>
                           <label for="new-promo" class="block text-sm font-medium text-text-secondary mb-2">Promo</label>
                           <input id="new-promo" type="number" bind:value={newUserPromo} min="2020" max="2030" class="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg" />
                       </div>
                       <div>
                           <label for="new-role" class="block text-sm font-medium text-text-secondary mb-2">Rôle</label>
                           <select id="new-role" bind:value={newUserRole} class="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg">
                               <option value="user">Utilisateur</option>
                               <option value="cercleux">Cercleux</option>
                           </select>
                       </div>
                       <div class="md:col-span-2">
                           <label for="new-statut" class="block text-sm font-medium text-text-secondary mb-2">Statut de cotisation</label>
                           <select id="new-statut" bind:value={newUserStatut} class="w-full px-3 py-2 bg-bg-primary border border-border rounded-lg">
                               <option value="non_cotisant">Non cotisant</option>
                               <option value="cotisant_sans_alcool">Cotisant sans alcool ({cotisationSansAlcool.toFixed(2)}€)</option>
                               <option value="cotisant_avec_alcool">Cotisant avec alcool ({cotisationAvecAlcool.toFixed(2)}€)</option>
                           </select>
                       </div>
                   </div>
                   {#if newUserLogin}
                       <div class="mt-3 p-3 bg-bg-primary/50 rounded border border-border text-sm">
                           <div class="text-text-muted mb-1">Login généré : <span class="font-mono text-text-primary">{newUserLogin}</span></div>
                           <div class="text-text-muted">Mail généré : <span class="font-mono text-text-primary">{newUserMail}</span></div>
                       </div>
                   {/if}
                   <button 
                       onclick={createUser} 
                       disabled={loading || !newUserPrenom || !newUserNom || !newUserPromo}
                       class="mt-4 px-4 py-2 bg-brand-red hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                       Créer l'utilisateur
                   </button>
               </div>

               <!-- Liste des utilisateurs -->
               <div class="space-y-4">
                   <h3 class="text-lg font-semibold text-text-primary">Utilisateurs existants</h3>
                   {#if users.length === 0}
                       <p class="text-text-muted">Aucun utilisateur trouvé</p>
                   {:else}
                       <div class="overflow-x-auto">
                           <table class="w-full">
                               <thead class="border-b border-border">
                                   <tr class="text-left">
                                       <th class="pb-2 text-sm font-semibold text-text-secondary">Login</th>
                                       <th class="pb-2 text-sm font-semibold text-text-secondary">Nom</th>
                                       <th class="pb-2 text-sm font-semibold text-text-secondary">Email</th>
                                       <th class="pb-2 text-sm font-semibold text-text-secondary">Promo</th>
                                       <th class="pb-2 text-sm font-semibold text-text-secondary">Solde</th>
                                       <th class="pb-2 text-sm font-semibold text-text-secondary">Rôle</th>
                                       <th class="pb-2 text-sm font-semibold text-text-secondary">Statut</th>
                                       <th class="pb-2 text-sm font-semibold text-text-secondary">Actions</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   {#each users as user}
                                       <tr class="border-b border-border hover:bg-bg-tertiary">
                                           <td class="py-3 text-text-primary font-mono text-sm">{user.login}</td>
                                           <td class="py-3 text-text-primary">{user.prenom} {user.nom}</td>
                                           <td class="py-3 text-text-secondary text-sm">{user.mail}</td>
                                           <td class="py-3 text-text-secondary">{user.promo}</td>
                                           <td class="py-3 {user.solde < 0 ? 'text-red-500' : 'text-green-500'} font-mono">{user.solde.toFixed(2)} €</td>
                                           <td class="py-3">
                                               <span class="px-2 py-1 rounded text-xs font-medium {user.role === 'cercleux' ? 'bg-brand-red/20 text-brand-red' : 'bg-bg-tertiary text-text-secondary'}">
                                                   {user.role === 'cercleux' ? 'Cercleux' : 'Utilisateur'}
                                               </span>
                                           </td>
                                           <td class="py-3">
                                               <span class="px-2 py-1 rounded text-xs font-medium {
                                                   user.statut_cotisation === 'cotisant_avec_alcool' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
                                                   user.statut_cotisation === 'cotisant_sans_alcool' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400' :
                                                   'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                                               }">
                                                   {user.statut_cotisation === 'cotisant_avec_alcool' ? 'Cotisant +alcool' :
                                                    user.statut_cotisation === 'cotisant_sans_alcool' ? 'Cotisant -alcool' :
                                                    'Non cotisant'}
                                               </span>
                                           </td>
                                           <td class="py-3 space-x-2">
                                               <button
                                                   onclick={() => openEditModal(user)}
                                                   class="text-brand-red hover:underline text-sm"
                                               >
                                                   Modifier
                                               </button>
                                               <button
                                                   onclick={() => deleteUser(user.id, user.login)}
                                                   class="text-red-600 hover:underline text-sm"
                                               >
                                                   Supprimer
                                               </button>
                                           </td>
                                       </tr>
                                   {/each}
                               </tbody>openDeleteConfirm(user
                           </table>
                       </div>
                   {/if}
               </div>
           
           {:else if activeTab === 'perms'}
               <h2 class="text-2xl font-bold mb-6 text-text-primary">Gestion des perms</h2>
               
               <!-- Créer une perm -->
               <div class="bg-bg-primary border border-border rounded-lg p-6 mb-6">
                   <h3 class="text-lg font-bold text-text-primary mb-4">Créer une perm</h3>
                   <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <input
                           type="text"
                           bind:value={newPermName}
                           placeholder="Nom de la perm"
                           class="px-4 py-2 border border-border rounded-lg bg-bg-secondary text-text-primary"
                       />
                       <input
                           type="text"
                           bind:value={newPermAnnee}
                           placeholder="Année"
                           class="px-4 py-2 border border-border rounded-lg bg-bg-secondary text-text-primary"
                       />
                       <button
                           onclick={createPerm}
                           disabled={loading || !newPermName}
                           class="px-6 py-2 bg-brand-red text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                       >
                           Créer
                       </button>
                   </div>
               </div>
               
               <!-- Liste des perms -->
               <div class="space-y-3">
                   {#each perms as perm}
                       <div class="bg-bg-primary border border-border rounded-lg p-4 flex items-center justify-between">
                           <div>
                               <div class="font-bold text-text-primary">{perm.nom}</div>
                               <div class="text-sm text-text-muted">{perm.annee} · {new Date(perm.date * 1000).toLocaleDateString('fr-FR')}</div>
                           </div>
                           <div class="flex items-center gap-2">
                               <button
                                   onclick={() => togglePerm(perm.id, perm.is_active)}
                                   class="px-4 py-2 rounded-lg font-medium transition-colors {perm.is_active ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}"
                               >
                                   {perm.is_active ? 'Ouverte' : 'Fermée'}
                               </button>
                               <button
                                   onclick={() => deletePerm(perm.id)}
                                   class="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                               >
                                   <Icon name="Trash2" size={18} />
                               </button>
                           </div>
                       </div>
                   {:else}
                       <p class="text-center text-text-muted py-8">Aucune perm</p>
                   {/each}
               </div>
           
           {:else if activeTab === 'recharge'}
               <h2 class="text-2xl font-bold mb-6 text-text-primary">Recharge de compte</h2>
               
               <div class="space-y-6">
                   <div>
                       <label for="recharge-user" class="block text-sm font-medium text-text-secondary mb-2">Utilisateur</label>
                       <UserSearch id="recharge-user" onSelect={(user) => selectedUserForRecharge = user} />
                       
                       {#if selectedUserForRecharge}
                           <div class="mt-3 p-4 bg-bg-primary border border-border rounded-lg">
                               <div class="flex items-center justify-between">
                                   <div>
                                       <div class="font-bold text-text-primary">{selectedUserForRecharge.prenom} {selectedUserForRecharge.nom}</div>
                                       <div class="text-sm text-text-muted">{selectedUserForRecharge.login}</div>
                                   </div>
                                   <div class="text-right">
                                       <div class="text-sm text-text-muted">Solde actuel</div>
                                       <div class="text-xl font-bold {selectedUserForRecharge.solde >= 0 ? 'text-green-600' : 'text-red-600'}">
                                           {selectedUserForRecharge.solde.toFixed(2)}€
                                       </div>
                                   </div>
                               </div>
                           </div>
                       {/if}
                   </div>
                   
                   {#if selectedUserForRecharge}
                       <div>
                           <span class="block text-sm font-medium text-text-secondary mb-2">Montant</span>
                           
                           {#if !customAmount}
                               <div class="grid grid-cols-3 gap-3 mb-3">
                                   {#each [5, 10, 20] as amount}
                                       <button
                                           onclick={() => rechargeAmount = amount}
                                           class="px-6 py-3 rounded-lg font-bold text-lg transition-colors {rechargeAmount === amount ? 'bg-brand-red text-white' : 'bg-bg-primary border border-border text-text-primary hover:border-brand-red'}"
                                       >
                                           {amount}€
                                       </button>
                                   {/each}
                               </div>
                               <button
                                   onclick={() => { customAmount = true; rechargeAmount = ''; }}
                                   class="text-sm text-brand-red hover:underline"
                               >
                                   Montant personnalisé
                               </button>
                           {:else}
                               <div class="flex gap-2">
                                   <input
                                       type="number"
                                       bind:value={rechargeAmount}
                                       placeholder="Montant en €"
                                       min="0"
                                       step="0.01"
                                       class="flex-1 px-4 py-2 border border-border rounded-lg bg-bg-primary text-text-primary"
                                   />
                                   <button
                                       onclick={() => { customAmount = false; rechargeAmount = ''; }}
                                       class="px-4 py-2 border border-border rounded-lg text-text-secondary hover:bg-bg-tertiary"
                                   >
                                       Annuler
                                   </button>
                               </div>
                           {/if}
                       </div>
                       
                       <button
                           onclick={handleRecharge}
                           disabled={loading || !rechargeAmount}
                           class="w-full px-6 py-3 bg-brand-red text-white rounded-lg font-bold text-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                       >
                           Recharger {rechargeAmount ? `${rechargeAmount}€` : ''}
                       </button>
                   {/if}
               </div>
           
           {:else if activeTab === 'boissons'}
               <h2 class="text-2xl font-bold mb-6 text-text-primary">Gestion des boissons</h2>
               <p class="text-text-muted">Section en construction...</p>
           
           {:else if activeTab === 'consommables'}
               <h2 class="text-2xl font-bold mb-6 text-text-primary">Gestion des consommables</h2>
               <p class="text-text-muted">Section en construction...</p>
           {/if}
           
       </div>
   </div>
</div>

<!-- Modal de modification utilisateur -->
{#if showEditModal && editingUser}
   <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onclick={closeEditModal}>
       <div class="bg-bg-secondary rounded-lg shadow-xl max-w-2xl w-full p-6" onclick={(e) => e.stopPropagation()}>
           <div class="flex justify-between items-center mb-6">
               <h3 class="text-xl font-bold text-text-primary">Modifier l'utilisateur</h3>
               <button onclick={closeEditModal} class="text-text-muted hover:text-text-primary">
                   <Icon name="X" size={24} />
          s -->
<EditUserModal
    bind:show={showEditModal}
    user={editingUser}
    onClose={closeEditModal}
    onSuccess={handleEditSuccess}
/>

<ConfirmModal
    bind:show={showDeleteConfirm}
    title="Supprimer l'utilisateur"
    message="Êtes-vous sûr de vouloir supprimer l'utilisateur {deletingUser?.login} ? Cette action est irréversible."
    confirmText="Supprimer"
    cancelText="Annuler"
    type="error"
    onConfirm={handleDeleteConfirm}
    onCancel={closeDeleteConfirm}
/>