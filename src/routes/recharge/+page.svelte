<script lang="ts">
    import Icon from '$lib/components/Icon.svelte';
    import PageBackground from '$lib/components/PageBackground.svelte';
    import UserSearch from '$lib/components/UserSearch.svelte';
    import { fade } from 'svelte/transition';

    let selectedUser = $state<any>(null);
    let amount = $state<number>(10);
    let customAmount = $state<string>('');
    let loading = $state(false);
    let success = $state(false);
    let error = $state('');

    const quickAmounts = [5, 10, 20, 50];

    async function handleRecharge() {
        if (!selectedUser) return;
        
        loading = true;
        error = '';
        
        const finalAmount = customAmount ? parseFloat(customAmount) : amount;

        try {
            const res = await fetch('/api/recharge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedUser.id, amount: finalAmount })
            });
            
            if (res.ok) {
                success = true;
                const updatedUser = await res.json(); // Assuming API returns updated user or we just clear
                // Visual feedback
                setTimeout(() => {
                    success = false;
                    selectedUser = null;
                    customAmount = '';
                    amount = 10;
                }, 2000);
            } else {
                const data = await res.json();
                error = data.error || 'Erreur lors du rechargement';
            }
        } catch (e) {
            error = "Erreur de connexion";
        } finally {
            loading = false;
        }
    }

    function selectUser(u: any) {
        selectedUser = u;
        error = '';
    }
</script>

<PageBackground variant="gradient" />

<div class="max-w-2xl mx-auto pt-24 px-4 pb-32 md:pb-20">
    <header class="mb-10 text-center">
        <h1 class="text-4xl font-black uppercase tracking-tighter italic mb-2 text-white">Rechargement</h1>
        <p class="text-slate-400 font-medium">Alimentez les comptes de la communauté</p>
    </header>

    <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        
        {#if success}
            <div class="absolute inset-0 bg-emerald-500/90 flex flex-col items-center justify-center z-50 text-white" transition:fade>
                <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center text-emerald-500 mb-4 animate-bounce">
                    <Icon name="Check" size={32} />
                </div>
                <h2 class="text-2xl font-bold">Rechargement effectué !</h2>
                <p class="opacity-90">Le solde a été mis à jour.</p>
            </div>
        {/if}

        <!-- 1. Selection User -->
        <div class="mb-8">
            <label class="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3" for="user-search">1. Sélectionner un soiffard</label>
            {#if !selectedUser}
                <UserSearch id="user-search" onSelect={selectUser} placeholder="Rechercher par nom, prénom..." />
            {:else}
                <div class="flex items-center justify-between bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center font-bold text-white text-lg overflow-hidden">
                            {#if selectedUser.photo_url}
                                <img src={selectedUser.photo_url} alt="Avatar" class="w-full h-full object-cover" />
                            {:else}
                                {selectedUser.prenom ? selectedUser.prenom[0] : '?'}{selectedUser.nom ? selectedUser.nom[0] : '?'}
                            {/if}
                        </div>
                        <div>
                            <div class="font-bold text-white text-lg">{selectedUser.prenom} {selectedUser.nom}</div>
                            <div class="text-rose-400 font-mono text-sm">{selectedUser.solde?.toFixed(2) || '0.00'} € actuels</div>
                        </div>
                    </div>
                    <button onclick={() => selectedUser = null} class="p-2 hover:bg-rose-500/20 rounded-lg text-rose-500 transition-colors">
                        <Icon name="X" />
                    </button>
                </div>
            {/if}
        </div>

        <!-- 2. Montant -->
        <div class="transition-all duration-500 {selectedUser ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-4 pointer-events-none grayscale'}">
            <div class="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">2. Choisir le montant</div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {#each quickAmounts as val}
                    <button 
                        class="h-14 rounded-xl border-2 font-black text-xl flex items-center justify-center transition-all active:scale-95
                        {amount === val && !customAmount ? 'border-amber-500 bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300'}"
                        onclick={() => { amount = val; customAmount = ''; }}
                    >
                        {val} €
                    </button>
                {/each}
            </div>

            <div class="relative mb-8">
                <input 
                    type="number" 
                    placeholder="Montant personnalisé" 
                    bind:value={customAmount}
                    class="w-full bg-black/20 border-2 border-white/10 rounded-xl py-3 pl-4 pr-12 font-mono font-bold text-white focus:outline-none focus:border-amber-500 transition-all {customAmount ? 'border-amber-500/50 text-amber-500' : 'text-slate-300'}"
                />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">€</span>
            </div>

            <button 
                onclick={handleRecharge}
                disabled={loading}
                class="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black uppercase tracking-widest shadow-lg shadow-rose-600/20 hover:shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {#if loading}
                    <Icon name="Loader2" class="animate-spin" /> Traitement...
                {:else}
                    <Icon name="Zap" /> Valider le rechargement
                {/if}
            </button>
            
            {#if error}
                <p class="mt-4 text-center text-red-500 font-bold">{error}</p>
            {/if}
        </div>
    </div>
</div>
