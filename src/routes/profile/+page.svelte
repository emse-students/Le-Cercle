<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import Icon from '$lib/components/Icon.svelte';
    import PageBackground from '$lib/components/PageBackground.svelte';
    import { formatCurrency, getAvatarUrl } from '$lib/theme-config';
    
    // Get user from layout
    let user = $derived($page.data.user);
    
    // Page load animation state
    let isLoaded = $state(false);
    let transactions = $state<any[]>([]);
    let loading = $state(true);
    
    onMount(async () => {
        setTimeout(() => isLoaded = true, 100);
        if (user?.id) {
            await loadTransactions();
        }
    });

    async function loadTransactions() {
        try {
            const res = await fetch(`/api/transactions?userId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                // Transformer les transactions pour le format d'affichage
                transactions = data.map((t: any) => ({
                    id: t.id,
                    type: t.type === 'R' ? 'recharge' : 'purchase',
                    description: getTransactionDescription(t),
                    amount: t.prix,
                    date: new Date(t.date * 1000).toLocaleDateString('fr-FR'),
                    perm: t.perm_nom || 'Système',
                    product: getItemName(t)
                }));
            }
        } catch (e) {
            console.error('Erreur chargement transactions:', e);
        } finally {
            loading = false;
        }
    }

    function getTransactionDescription(t: any) {
        if (t.type === 'R') return 'Rechargement';
        if (t.type === 'B') return 'Boisson';
        if (t.type === 'C') return 'Consommable';
        return 'Transaction';
    }

    function getItemName(t: any) {
        if (t.type === 'R') return 'Recharge';
        if (t.type === 'B') return `${t.boisson_nom || '?'} ${t.contenant_nom || ''}`;
        if (t.type === 'C') return t.consommable_nom || '?';
        return `Item #${t.id_item || '?'}`;
    }

</script>

<PageBackground variant="minimal" />

<div class="max-w-4xl mx-auto px-4 pt-24 pb-32 md:pb-8 space-y-8 transition-all duration-700 {isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}">
    
    <!-- User Header & Balance -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Identity Card -->
        <div class="lg:col-span-2 relative overflow-hidden rounded-[2rem] bg-bg-card border border-white/5 p-8 group">
            <div class="absolute top-0 right-0 w-32 h-32 bg-brand-red/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
            
            <div class="relative z-10 flex items-center gap-6">
                <!-- Avatar -->
                <div class="relative shrink-0">
                    <div class="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 bg-bg-tertiary">
                         <img 
                            src={getAvatarUrl(user?.firstname || '?', user?.lastname || '?', user?.photo_url)} 
                            alt="Avatar" 
                            class="w-full h-full object-cover"
                        />
                    </div>
                    <div class="absolute -bottom-1 -right-1 bg-bg-card p-1 rounded-full border border-white/5">
                        <div class="bg-success w-4 h-4 rounded-full border-2 border-bg-card"></div>
                    </div>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-2">
                         <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-red/10 text-brand-red text-[10px] font-bold uppercase tracking-widest border border-brand-red/20">
                            <Icon name="Shield" size={10} />
                            {user?.role || 'Membre'}
                         </span>
                    </div>
                    <h1 class="text-3xl font-bold truncate text-text-primary">
                        {user?.firstname} {user?.lastname}
                    </h1>
                    <p class="text-text-muted text-sm truncate">{user?.login || user?.mail} · {user?.promo || 'Non renseigné'}</p>
                </div>
            </div>
        </div>

        <!-- Wallet Card -->
        <div class="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-yellow to-yellow-600 p-8 shadow-lg shadow-brand-yellow/20 group cursor-pointer transition-transform hover:scale-[1.02]">
             <div class="absolute -right-4 -top-4 opacity-20 text-black group-hover:rotate-12 transition-transform duration-500">
                <Icon name="Beer" size={80} />
             </div>
             
             <div class="relative z-10 flex flex-col justify-between h-full space-y-8">
                 <div>
                    <div class="text-[10px] font-black uppercase tracking-widest text-black/60 mb-2">Solde Actuel</div>
                    <div class="text-5xl font-black text-black tracking-tighter">
                        {formatCurrency(user?.solde || 0)}
                    </div>
                 </div>
                 
                 <div class="flex justify-between items-end">
                    <div class="text-black/50 text-xs font-mono">
                        ID: {user?.id || '---'}
                    </div>
                 </div>
             </div>
        </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-2 gap-4">
        <a href="/recharge" class="flex items-center justify-center gap-3 p-6 rounded-3xl bg-brand-red text-white font-bold uppercase tracking-widest text-sm shadow-xl shadow-brand-red/20 hover:bg-brand-red-hover transition-all active:scale-95 group">
            <Icon name="PlusCircle" class="group-hover:rotate-90 transition-transform" />
            Recharger
        </a>
        <button class="flex items-center justify-center gap-3 p-6 rounded-3xl bg-bg-card border border-white/5 text-text-primary font-bold uppercase tracking-widest text-sm hover:bg-bg-secondary transition-all active:scale-95">
            <Icon name="History" />
            Historique
        </button>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Recent Transactions -->
         <div class="lg:col-span-2 space-y-6">
            <div class="flex items-center justify-between px-2">
                <h2 class="text-lg font-bold uppercase tracking-widest text-text-muted">Dernières Soifs</h2>
                <button class="text-xs font-bold text-brand-red uppercase tracking-widest hover:underline">Tout voir</button>
            </div>

            <div class="space-y-4">
                {#if loading}
                    <div class="flex items-center justify-center py-12">
                        <Icon name="Loader2" class="animate-spin text-brand-red" size={32} />
                    </div>
                {:else if transactions.length === 0}
                    <div class="text-center py-12">
                        <div class="text-text-muted mb-2">
                            <Icon name="Inbox" size={48} class="mx-auto opacity-50" />
                        </div>
                        <p class="text-text-muted">Aucune transaction pour le moment</p>
                    </div>
                {:else}
                    {#each transactions as tx (tx.id)}
                        <div class="flex items-center gap-4 p-4 rounded-2xl bg-bg-card border border-white/5 hover:border-white/10 transition-colors group">
                            <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 {tx.amount > 0 ? 'bg-success/10 text-success' : 'bg-brand-red/10 text-brand-red'}">
                                <Icon name={tx.amount > 0 ? 'Plus' : 'Beer'} size={20} />
                            </div>
                            
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between mb-1">
                                    <h3 class="font-bold text-text-primary truncate">{tx.product}</h3>
                                    <span class="font-bold {tx.amount > 0 ? 'text-success' : 'text-text-primary'}">
                                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                    </span>
                                </div>
                                <div class="flex items-center justify-between text-xs text-text-muted">
                                    <span>{tx.perm}</span>
                                    <span>{tx.date}</span>
                                </div>
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>
         </div>

         <!-- Statistics / Badges (Placeholder) -->
         <div class="space-y-6">
             <div class="flex items-center justify-between px-2">
                <h2 class="text-lg font-bold uppercase tracking-widest text-text-muted">Trophées</h2>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div class="aspect-square rounded-2xl bg-bg-card border border-white/5 flex flex-col items-center justify-center gap-3 p-4 text-center grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed">
                    <Icon name="Trophy" size={32} class="text-brand-yellow" />
                    <span class="text-xs font-bold text-text-secondary">Pilier de Bar</span>
                </div>
                 <div class="aspect-square rounded-2xl bg-bg-card border border-white/5 flex flex-col items-center justify-center gap-3 p-4 text-center grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed">
                    <Icon name="Flame" size={32} class="text-brand-red" />
                    <span class="text-xs font-bold text-text-secondary">Série en cours</span>
                </div>
            </div>
         </div>
    </div>
</div>