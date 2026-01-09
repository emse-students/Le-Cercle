<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import Icon from '$lib/components/Icon.svelte';
    import UserSearch from '$lib/components/UserSearch.svelte';
    import ItemSelector from '$lib/components/ItemSelector.svelte';
    
    let activePerm = $state<any>(null);
    let selectedUser = $state<any>(null);
    let transactions = $state<any[]>([]);
    let itemType = $state<'boisson' | 'consommable'>('boisson');
    let loading = $state(false);
    let message = $state({ type: '', text: '' });
    
    onMount(async () => {
        // Charger la perm active de l'utilisateur
        try {
            const res = await fetch('/api/perms/active');
            if (res.ok) {
                activePerm = await res.json();
                if (activePerm) {
                    loadTransactions();
                }
            }
        } catch (err) {
            console.error('Error loading active perm:', err);
        }
    });
    
    async function loadTransactions() {
        if (!activePerm) return;
        
        try {
            const res = await fetch(`/api/transactions?permId=${activePerm.id}`);
            if (res.ok) {
                transactions = await res.json();
            }
        } catch (err) {
            console.error('Error loading transactions:', err);
        }
    }
    
    async function handleEncaissement(item: any, quantity: number) {
        if (!selectedUser || !activePerm) return;
        
        loading = true;
        message = { type: '', text: '' };
        
        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedUser.id,
                    permId: activePerm.id,
                    type: itemType === 'boisson' ? 'B' : 'C',
                    itemId: item.id,
                    quantity,
                    price: item.prix_vente * quantity
                })
            });
            
            if (res.ok) {
                message = { type: 'success', text: `${quantity}× ${item.nom || item.contenu_nom} encaissé pour ${selectedUser.prenom} ${selectedUser.nom}` };
                selectedUser = null;
                loadTransactions();
            } else {
                const error = await res.json();
                message = { type: 'error', text: error.error || 'Erreur lors de l\'encaissement' };
            }
        } catch (err) {
            message = { type: 'error', text: 'Erreur réseau' };
        } finally {
            loading = false;
        }
    }
</script>

<div class="max-w-7xl mx-auto px-4 py-8 space-y-6">
    <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold text-text-primary">Service</h1>
        {#if activePerm}
            <div class="px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-lg font-medium flex items-center gap-2">
                <div class="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                Perm ouverte
            </div>
        {:else}
            <div class="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 rounded-lg font-medium">
                Aucune perm active
            </div>
        {/if}
    </div>
    
    {#if !activePerm}
        <div class="bg-bg-secondary border border-border rounded-lg p-8 text-center">
            <Icon name="AlertCircle" size={48} class="mx-auto text-text-muted mb-4" />
            <h2 class="text-xl font-bold text-text-primary mb-2">Aucune perm active</h2>
            <p class="text-text-muted">Vous devez être assigné à une perm ouverte pour pouvoir encaisser.</p>
        </div>
    {:else}
        <!-- Encaissement -->
        <div class="bg-bg-secondary border border-border rounded-lg p-6 space-y-6">
            <h2 class="text-xl font-bold text-text-primary flex items-center gap-2">
                <Icon name="CreditCard" size={24} />
                Encaissement
            </h2>
            
            {#if message.text}
                <div class="p-4 rounded-lg {message.type === 'success' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'}">
                    {message.text}
                </div>
            {/if}
            
            <div class="space-y-4">
                <div>
                    <label for="serve-user" class="block text-sm font-medium text-text-secondary mb-2">Utilisateur</label>
                    <UserSearch id="serve-user" onSelect={(user) => selectedUser = user} disabled={loading} />
                    
                    {#if selectedUser}
                        <div class="mt-2 p-3 bg-bg-primary border border-border rounded-lg flex items-center justify-between">
                            <div>
                                <div class="font-medium text-text-primary">{selectedUser.prenom} {selectedUser.nom}</div>
                                <div class="text-sm text-text-muted">{selectedUser.login}</div>
                            </div>
                            <div class="text-right">
                                <div class="text-sm text-text-muted">Solde</div>
                                <div class="font-bold {selectedUser.solde >= 0 ? 'text-green-600' : 'text-red-600'}">
                                    {selectedUser.solde.toFixed(2)}€
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
                
                {#if selectedUser}
                    <div>
                        <div class="flex gap-2 mb-4">
                            <button
                                onclick={() => itemType = 'boisson'}
                                class="flex-1 px-4 py-2 rounded-lg font-medium transition-colors {itemType === 'boisson' ? 'bg-brand-red text-white' : 'bg-bg-primary border border-border text-text-secondary hover:border-brand-red'}"
                            >
                                <Icon name="Beer" size={18} class="inline mr-2" />
                                Boissons
                            </button>
                            <button
                                onclick={() => itemType = 'consommable'}
                                class="flex-1 px-4 py-2 rounded-lg font-medium transition-colors {itemType === 'consommable' ? 'bg-brand-red text-white' : 'bg-bg-primary border border-border text-text-secondary hover:border-brand-red'}"
                            >
                                <Icon name="Cookie" size={18} class="inline mr-2" />
                                Consommables
                            </button>
                        </div>
                        
                        <ItemSelector type={itemType} onSelect={handleEncaissement} disabled={loading} />
                    </div>
                {/if}
            </div>
        </div>
        
        <!-- Historique de la perm -->
        <div class="bg-bg-secondary border border-border rounded-lg p-6">
            <h2 class="text-xl font-bold text-text-primary flex items-center gap-2 mb-4">
                <Icon name="History" size={24} />
                Historique de la perm
            </h2>
            
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="border-b border-border">
                            <th class="text-left py-3 px-4 text-sm font-medium text-text-secondary">Heure</th>
                            <th class="text-left py-3 px-4 text-sm font-medium text-text-secondary">Utilisateur</th>
                            <th class="text-left py-3 px-4 text-sm font-medium text-text-secondary">Article</th>
                            <th class="text-right py-3 px-4 text-sm font-medium text-text-secondary">Qté</th>
                            <th class="text-right py-3 px-4 text-sm font-medium text-text-secondary">Prix</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each transactions as transaction}
                            <tr class="border-b border-border hover:bg-bg-tertiary transition-colors">
                                <td class="py-3 px-4 text-sm text-text-muted">
                                    {new Date(transaction.date * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td class="py-3 px-4 text-sm text-text-primary">{transaction.user_prenom} {transaction.user_nom}</td>
                                <td class="py-3 px-4 text-sm text-text-primary">{transaction.item_nom}</td>
                                <td class="py-3 px-4 text-sm text-right text-text-primary">{transaction.nb}</td>
                                <td class="py-3 px-4 text-sm text-right font-medium text-red-600">{transaction.prix.toFixed(2)}€</td>
                            </tr>
                        {:else}
                            <tr>
                                <td colspan="5" class="py-8 text-center text-text-muted">Aucune transaction pour le moment</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}
</div>
