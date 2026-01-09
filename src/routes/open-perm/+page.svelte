<script lang="ts">
    import Icon from '$lib/components/Icon.svelte';
    
    // Mock Data
    const items = [
        { id: 1, name: "Pinte Blonde", type: "biere", price: 350, stock: "fut" },
        { id: 2, name: "Pinte Rouge", type: "biere", price: 400, stock: "fut" },
        { id: 3, name: "Coca Cola", type: "soft", price: 100, stock: "canette" },
        { id: 4, name: "Chips", type: "snack", price: 150, stock: "sachet" },
    ];

    let permName = $state("");
    let inventory = $state(items.map(i => ({...i, active: true})));
    let newPermMode = $state(true);

    function toggleActive(id: number) {
        const idx = inventory.findIndex(i => i.id === id);
        if (idx !== -1) inventory[idx].active = !inventory[idx].active;
    }

    function updatePrice(id: number, delta: number) {
        const idx = inventory.findIndex(i => i.id === id);
        if (idx !== -1) inventory[idx].price = Math.max(0, inventory[idx].price + delta);
    }

    function formatPrice(cents: number) {
        return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
    }
</script>

<div class="max-w-4xl mx-auto p-4 md:p-8">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 class="text-3xl font-black">Ouvrir une perm</h1>
        
        <div class="flex bg-bg-secondary p-1 rounded-lg">
            <button 
                class="px-4 py-2 rounded-md font-medium text-sm transition-all {newPermMode ? 'bg-bg-card shadow-sm text-brand-dark' : 'text-text-muted hover:text-text-primary'}"
                onclick={() => newPermMode = true}
            >
                Nouvelle
            </button>
            <button 
                class="px-4 py-2 rounded-md font-medium text-sm transition-all {!newPermMode ? 'bg-bg-card shadow-sm text-brand-dark' : 'text-text-muted hover:text-text-primary'}"
                onclick={() => newPermMode = false}
            >
                Réouvrir
            </button>
        </div>
    </div>

    <!-- Configuration Card -->
    <div class="bg-bg-card rounded-2xl shadow-sm border border-border p-6 mb-8">
        <div class="mb-8">
            <label for="permName" class="block text-sm font-bold text-text-muted mb-2 uppercase tracking-wide">Nom de la perm</label>
            <input 
                id="permName"
                type="text" 
                bind:value={permName}
                placeholder="Ex: Soirée Integration, Perm Midi..."
                class="w-full bg-bg-secondary border border-border rounded-xl px-4 py-3 font-bold text-lg outline-none focus:ring-2 focus:ring-brand-yellow/50"
            />
        </div>

        <div class="mb-4 flex justify-between items-end">
             <h2 class="text-xl font-bold flex items-center gap-2">
                <Icon name="ClipboardList" />
                La Carte
            </h2>
            <button class="text-sm text-brand-red font-medium hover:underline flex items-center gap-1">
                <Icon name="Plus" size={14} /> Ajouter un produit
            </button>
        </div>
       
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {#each inventory as item}
                <div class="flex items-center justify-between p-4 rounded-xl border transition-all {item.active ? 'bg-bg-card border-brand-yellow/30 shadow-sm' : 'bg-bg-secondary/30 border-dashed border-border opacity-60'}">
                    <div class="flex items-center gap-4">
                        <button 
                            onclick={() => toggleActive(item.id)}
                            class="w-6 h-6 rounded border flex items-center justify-center transition-colors {item.active ? 'bg-brand-yellow border-brand-yellow text-brand-dark' : 'border-text-muted text-transparent'}"
                        >
                            <Icon name="Check" size={14} />
                        </button>
                        
                        <div>
                            <div class="font-bold">{item.name}</div>
                            <div class="text-xs text-text-muted uppercase">{item.type} • {item.stock}</div>
                        </div>
                    </div>

                    {#if item.active}
                        <div class="flex items-center gap-2 bg-bg-secondary rounded-lg p-1">
                            <button onclick={() => updatePrice(item.id, -10)} class="w-8 h-8 flex items-center justify-center hover:bg-bg-card rounded shadow-sm text-brand-red">
                                <Icon name="Minus" size={14} />
                            </button>
                            <span class="font-mono font-bold w-12 text-center text-sm">{formatPrice(item.price)}</span>
                            <button onclick={() => updatePrice(item.id, 10)} class="w-8 h-8 flex items-center justify-center hover:bg-bg-card rounded shadow-sm text-green-600">
                                <Icon name="Plus" size={14} />
                            </button>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>

    <!-- Action Bar -->
    <div class="fixed bottom-16 md:bottom-0 left-0 w-full bg-bg-card border-t border-border p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40">
        <div class="max-w-4xl mx-auto flex justify-between items-center">
            <div class="hidden md:block">
                <span class="text-text-muted text-sm">Prêt à servir ?</span>
                <div class="font-bold">{inventory.filter(i => i.active).length} produits à la carte</div>
            </div>
            <button 
                class="w-full md:w-auto bg-brand-red hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                disabled={!permName}
            >
                <Icon name="Store" />
                Ouvrir la Perm
            </button>
        </div>
    </div>
    <div class="h-24"></div> <!-- Spacer -->
</div>
