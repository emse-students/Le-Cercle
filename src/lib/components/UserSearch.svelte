<script lang="ts">
    import Icon from '$lib/components/Icon.svelte';
    
    let { 
        placeholder = "Rechercher un utilisateur...",
        onSelect,
        disabled = false,
        id = undefined,
        class: className = "",
        ...rest
    }: {
        placeholder?: string;
        onSelect: (user: any) => void;
        disabled?: boolean;
        id?: string;
        class?: string;
        [key: string]: any;
    } = $props();
    
    let query = $state('');
    let results = $state<any[]>([]);
    let loading = $state(false);
    let showDropdown = $state(false);
    
    async function search() {
        if (query.length < 2) {
            results = [];
            showDropdown = false;
            return;
        }
        
        loading = true;
        try {
            const res = await fetch(`/api/users?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                results = await res.json();
                showDropdown = true;
            }
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            loading = false;
        }
    }
    
    function selectUser(user: any) {
        onSelect(user);
        query = '';
        results = [];
        showDropdown = false;
    }
    
    $effect(() => {
        // Dependency on query for searching
        if (query.length >= 2) {
             const timer = setTimeout(search, 300);
             return () => clearTimeout(timer);
        } else {
             results = [];
             showDropdown = false;
        }
    });
</script>

<div class="relative">
    <div class="relative">
        <input
            {id}
            type="text"
            bind:value={query}
            {placeholder}
            {disabled}
            class={className || "w-full px-4 py-2 pl-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red bg-bg-primary text-text-primary"}
            {...rest}
        />
        <Icon name="Search" size={18} class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        {#if loading}
            <Icon name="Loader2" size={18} class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted animate-spin" />
        {/if}
    </div>
    
    {#if showDropdown && results.length > 0}
        <div class="absolute z-50 w-full mt-1 bg-bg-primary border border-border rounded-lg shadow-custom-md max-h-64 overflow-y-auto">
            {#each results as user}
                <button
                    onclick={() => selectUser(user)}
                    class="w-full px-4 py-2 text-left hover:bg-bg-secondary transition-colors flex items-center justify-between"
                >
                    <div>
                        <div class="font-medium text-text-primary">{user.prenom} {user.nom}</div>
                        <div class="text-sm text-text-muted">{user.login} · {user.promo}</div>
                    </div>
                    <div class="text-sm font-medium {user.solde >= 0 ? 'text-green-600' : 'text-red-600'}">
                        {user.solde.toFixed(2)}€
                    </div>
                </button>
            {/each}
        </div>
    {/if}
</div>
