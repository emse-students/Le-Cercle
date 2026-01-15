<script lang="ts">
    import Icon from '$lib/components/Icon.svelte';
    import type { Boisson, Consommable } from '$lib/types';
    
    let { 
        type = 'boisson',
        onSelect,
        disabled = false,
        items = $bindable([]) // Accept items from parent
    }: {
        type?: 'boisson' | 'consommable';
        onSelect: (item: Boisson | Consommable, quantity: number) => void;
        disabled?: boolean;
        items?: any[];
    } = $props();
    
    let selectedItem = $state<any | null>(null);
    let quantity = $state(1);
    
    async function loadItems() {
        if (items.length > 0) return; // Don't load if provided
        try {
            const endpoint = type === 'boisson' ? '/api/boissons' : '/api/consommables';
            const res = await fetch(endpoint);
            if (res.ok) {
                items = await res.json();
            }
        } catch (err) {
            console.error('Load items error:', err);
        }
    }
    
    function increment() {
        quantity++;
    }
    
    function decrement() {
        if (quantity > 1) quantity--;
    }
    
    function handleSelect() {
        if (selectedItem) {
            onSelect(selectedItem, quantity);
            selectedItem = null;
            quantity = 1;
        }
    }
    
    $effect(() => {
        loadItems();
    });
</script>

<div class="space-y-4">
    <!-- Grid des boissons/consommables -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {#each items as item}
            <button
                onclick={() => selectedItem = item}
                {disabled}
                class="p-4 border rounded-lg transition-all {selectedItem?.id === item.id ? 'border-brand-red bg-brand-red/10' : 'border-border hover:border-brand-red/50 bg-bg-secondary'}"
            >
                <div class="text-center">
                    <div class="font-medium text-text-primary">{item.nom || `${item.contenu_nom} ${item.contenant_nom}`}</div>
                    <div class="text-lg font-bold text-brand-red mt-1">{item.prix_vente.toFixed(2)}€</div>
                    {#if type === 'boisson' && item.contenu_degre}
                        <div class="text-xs text-text-muted">{item.contenu_degre}°</div>
                    {/if}
                </div>
            </button>
        {/each}
    </div>
    
    {#if selectedItem}
        <div class="flex items-center gap-4 p-4 bg-bg-secondary rounded-lg border border-border">
            <div class="flex-1">
                <div class="font-medium text-text-primary">{selectedItem.nom || `${selectedItem.contenu_nom} ${selectedItem.contenant_nom}`}</div>
                <div class="text-sm text-text-muted">{selectedItem.prix_vente.toFixed(2)}€ × {quantity} = <span class="font-bold text-brand-red">{(selectedItem.prix_vente * quantity).toFixed(2)}€</span></div>
            </div>
            
            <div class="flex items-center gap-2">
                <button onclick={decrement} class="w-8 h-8 rounded-lg bg-bg-primary border border-border flex items-center justify-center hover:bg-bg-tertiary transition-colors">
                    <Icon name="Minus" size={16} />
                </button>
                <span class="w-12 text-center font-bold text-text-primary">{quantity}</span>
                <button onclick={increment} class="w-8 h-8 rounded-lg bg-bg-primary border border-border flex items-center justify-center hover:bg-bg-tertiary transition-colors">
                    <Icon name="Plus" size={16} />
                </button>
            </div>
            
            <button onclick={handleSelect} class="px-6 py-2 bg-brand-red text-white rounded-lg font-medium hover:bg-red-600 transition-colors">
                Valider
            </button>
        </div>
    {/if}
</div>
