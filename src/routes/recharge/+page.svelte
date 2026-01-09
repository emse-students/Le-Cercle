<script lang="ts">
    import Icon from '$lib/components/Icon.svelte';
    
    // Mock Users for search
    const users = [
        { id: 1, prenom: "Lucas", nom: "Etudiant", promo: 2026, solde: 1450, email: "lucas@emse.fr" },
        { id: 2, prenom: "Emma", nom: "Ingenieure", promo: 2025, solde: -250, email: "emma@emse.fr" },
        { id: 3, prenom: "Paul", nom: "Barman", promo: 2024, solde: 5000, email: "paul@emse.fr" }
    ];

    let items = $state(users);
    let searchTerm = $state("");
    let selectedUser = $state<typeof users[0] | null>(null);
    let amount = $state(0);
    let isSuccess = $state(false);

    let filteredUsers = $derived(
        searchTerm.length > 1 
            ? items.filter(u => `${u.prenom} ${u.nom}`.toLowerCase().includes(searchTerm.toLowerCase()))
            : []
    );

    function selectUser(user: typeof users[0]) {
        selectedUser = user;
        searchTerm = "";
        amount = 0;
        isSuccess = false;
    }

    function adjustAmount(delta: number) {
        amount += delta;
    }

    function validate() {
        if (!selectedUser) return;
        // Mock API Call
        selectedUser.solde += amount * 100;
        isSuccess = true;
        setTimeout(() => {
            isSuccess = false;
            selectedUser = null;
        }, 2000);
    }

    function formatCurrency(cents: number) {
        return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
    }
</script>

<div class="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
    <h1 class="text-3xl font-black mb-6">Rechargement</h1>

    <!-- Search Section -->
    <div class="relative z-20">
        <div class="flex items-center bg-bg-card border border-border rounded-xl p-3 shadow-sm focus-within:ring-2 focus-within:ring-brand-red/50">
            <Icon name="Search" class="text-text-muted mr-3" />
            <input 
                type="text" 
                bind:value={searchTerm}
                placeholder="Rechercher un étudiant (nom, prénom)" 
                class="bg-transparent border-none outline-none w-full text-lg placeholder-text-muted/50"
            />
            {#if selectedUser}
                <button onclick={() => selectedUser = null} class="text-text-muted hover:text-brand-red">
                    <Icon name="X" />
                </button>
            {/if}
        </div>

        <!-- Autocomplete Suggestions -->
        {#if filteredUsers.length > 0}
            <div class="absolute top-full left-0 w-full bg-bg-card border border-border mt-1 rounded-xl shadow-xl overflow-hidden">
                {#each filteredUsers as user}
                    <button 
                        onclick={() => selectUser(user)}
                        class="w-full text-left p-4 hover:bg-bg-secondary flex justify-between items-center transition-colors border-b last:border-0 border-border"
                    >
                        <div>
                            <div class="font-bold">{user.prenom} {user.nom}</div>
                            <div class="text-xs text-text-muted">Promo {user.promo}</div>
                        </div>
                        <div class="font-mono {user.solde < 0 ? 'text-brand-red' : 'text-green-600'}">
                            {formatCurrency(user.solde)}
                        </div>
                    </button>
                {/each}
            </div>
        {/if}
    </div>

    <!-- Recharge Card -->
    {#if selectedUser}
        <div class="bg-bg-card rounded-2xl shadow-lg border border-border p-6 animate-in slide-in-from-bottom-4 duration-300">
            {#if isSuccess}
                <div class="flex flex-col items-center justify-center py-10 text-green-600 animate-in zoom-in duration-300">
                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <Icon name="Check" size={32} />
                    </div>
                    <h3 class="text-xl font-bold">Rechargement effectué !</h3>
                    <p class="text-text-muted">Nouveau solde : {formatCurrency(selectedUser.solde)}</p>
                </div>
            {:else}
                <div class="flex justify-between items-start mb-8">
                    <div>
                        <h2 class="text-2xl font-bold">{selectedUser.prenom} {selectedUser.nom}</h2>
                        <p class="text-text-muted">Promo {selectedUser.promo}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-sm text-text-muted">Solde actuel</div>
                        <div class="text-2xl font-bold font-mono {selectedUser.solde < 0 ? 'text-brand-red' : 'text-text-primary'}">
                            {formatCurrency(selectedUser.solde)}
                        </div>
                    </div>
                </div>

                <!-- Input Amount -->
                <div class="flex flex-col items-center gap-6 mb-8">
                    <div class="flex items-center gap-4">
                        <button onclick={() => adjustAmount(-5)} class="w-12 h-12 rounded-full bg-bg-secondary hover:bg-brand-red/10 hover:text-brand-red flex items-center justify-center transition-colors">
                            <Icon name="Minus" />
                        </button>
                        
                        <div class="relative">
                            <input 
                                type="number" 
                                bind:value={amount} 
                                class="text-5xl font-bold w-48 text-center bg-transparent outline-none appearance-none m-0"
                            />
                            <span class="absolute top-1/2 -translate-y-1/2 right-4 text-2xl text-text-muted">€</span>
                        </div>

                        <button onclick={() => adjustAmount(5)} class="w-12 h-12 rounded-full bg-bg-secondary hover:bg-green-100 hover:text-green-600 flex items-center justify-center transition-colors">
                            <Icon name="Plus" />
                        </button>
                    </div>

                    <div class="flex gap-2">
                        {#each [5, 10, 20, 50] as val}
                            <button 
                                onclick={() => amount = val}
                                class="px-3 py-1 bg-bg-secondary rounded-lg text-sm font-medium hover:bg-brand-yellow/20 hover:text-brand-dark transition-colors"
                            >
                                {val}€
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- Summary & Action -->
                <div class="bg-bg-secondary/50 rounded-xl p-4 flex justify-between items-center mb-6">
                    <span class="font-medium text-text-muted">Solde après transaction</span>
                    <span class="font-bold text-xl">{formatCurrency(selectedUser.solde + amount * 100)}</span>
                </div>

                <button 
                    onclick={validate}
                    disabled={amount === 0}
                    class="w-full bg-brand-red text-white font-bold py-4 rounded-xl shadow-md hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <Icon name="Zap" />
                    Valider le rechargement
                </button>
            {/if}
        </div>
    {/if}

    <!-- Recent History (Placeholder) -->
    <div class="mt-12">
        <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
            <Icon name="History" size={18} />
            Derniers rechargements
        </h3>
        <div class="bg-bg-card rounded-xl border border-border overflow-hidden">
             <div class="p-4 text-center text-text-muted italic">
                 Aucun historique récent.
             </div>
        </div>
    </div>
</div>
