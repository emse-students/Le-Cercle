<script lang="ts">
    import { onMount } from 'svelte';
    import Icon from '$lib/components/Icon.svelte';
    import PageBackground from '$lib/components/PageBackground.svelte';
    import { formatCurrency } from '$lib/theme-config';
    import AdminUserModal from '$lib/components/AdminUserModal.svelte';
    import AdminPermModal from '$lib/components/AdminPermModal.svelte';
    import EditPermModal from '$lib/components/EditPermModal.svelte';
    import { fade } from 'svelte/transition';

    let activeTab = $state('users'); // 'users', 'perms'
    let users = $state<any[]>([]);
    let perms = $state<any[]>([]);
    let loading = $state(false);
    let error = $state('');

    // --- USERS MANAGEMENT ---
    let userSearch = $state('');
    let selectedUser = $state<any>(null);
    let showEditModal = $state(false);

    // --- PERMS MANAGEMENT ---
    let newPermName = $state('');
    let selectedPerm = $state<any>(null);
    let showPermModal = $state(false); // For stats

    let showEditPermModal = $state(false);
    let permToEdit = $state<any>(null);

    onMount(async () => {
        await loadUsers();
        await loadPerms();
    });

    async function loadUsers() {
        try {
            const res = await fetch('/api/users?limit=50'); // Fetch last 50 or search
            if (res.ok) users = await res.json();
        } catch(e) { console.error(e); }
    }

    async function searchUsers() {
        if (!userSearch) return loadUsers();
        try {
            const res = await fetch(`/api/users?q=${userSearch}`);
            if (res.ok) users = await res.json();
        } catch(e) { console.error(e); }
    }

    async function loadPerms() {
        try {
            const res = await fetch('/api/perms');
            if (res.ok) perms = await res.json();
        } catch(e) { console.error(e); }
    }

    function editUser(user: any) {
        selectedUser = user;
        showEditModal = true;
    }

    function openPerm(perm: any) {
        selectedPerm = perm;
        showPermModal = true;
    }

    function createPerm() {
        permToEdit = null;
        showEditPermModal = true; 
    }

    function editPerm(e: Event, perm: any) {
        e.stopPropagation();
        permToEdit = perm;
        showEditPermModal = true;
    }

    function closeModal() {
        showEditModal = false;
        selectedUser = null;
        showPermModal = false;
        selectedPerm = null;
        showEditPermModal = false;
        permToEdit = null;
    }
</script>

<PageBackground variant="gradient" />

<div class="min-h-screen pt-24 px-4 md:px-8 max-w-7xl mx-auto pb-32 md:pb-20">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
           <h1 class="text-4xl font-black uppercase tracking-tighter italic text-text-primary">Administration</h1>
           <p class="text-text-muted font-medium">Gestion du Cercle et des perms</p>
        </div>
        
        <div class="flex bg-bg-secondary p-1 rounded-xl border border-border">
            <button 
                onclick={() => activeTab = 'users'}
                class="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all {activeTab === 'users' ? 'bg-brand-red text-white shadow-lg' : 'text-text-muted hover:text-text-primary'}"
            >
                Utilisateurs
            </button>
            <button 
                onclick={() => activeTab = 'perms'}
                class="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all {activeTab === 'perms' ? 'bg-brand-yellow text-black shadow-lg' : 'text-text-muted hover:text-text-primary'}"
            >
                Perms
            </button>
        </div>
    </header>

    {#if activeTab === 'users'}
        <div class="bg-bg-card border border-border rounded-3xl overflow-hidden backdrop-blur-md" in:fade>
            <div class="p-6 border-b border-border flex flex-col md:flex-row gap-4 justify-between">
                <div class="relative max-w-md w-full">
                    <Icon name="Search" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input 
                        type="text" 
                        placeholder="Rechercher un membre..." 
                        bind:value={userSearch}
                        oninput={searchUsers}
                        class="w-full bg-bg-secondary border border-border rounded-xl py-3 pl-10 pr-4 text-text-primary focus:outline-none focus:border-brand-red transition-colors"
                    />
                </div>
                <button class="px-4 py-2 bg-brand-red/20 text-brand-red border border-brand-red/30 rounded-xl font-bold hover:bg-brand-red hover:text-white transition-all flex items-center gap-2">
                    <Icon name="PlusCircle" size={18} /> Nouveau Membre
                </button>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="bg-bg-secondary text-text-muted text-[10px] uppercase tracking-widest">
                            <th class="p-4">Identité</th>
                            <th class="p-4">Promo</th>
                            <th class="p-4">Rôle</th>
                            <th class="p-4">Statut</th>
                            <th class="p-4 text-right">Solde</th>
                            <th class="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-border text-sm">
                        {#each users as user}
                            <tr class="hover:bg-bg-secondary/50 transition-colors group">
                                <td class="p-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center font-bold text-text-primary text-xs">
                                            {user.prenom[0]}{user.nom[0]}
                                        </div>
                                        <div>
                                            <div class="font-bold text-text-primary">{user.prenom} {user.nom}</div>
                                            <div class="text-[10px] text-text-muted">{user.login}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="p-4 text-text-secondary font-mono">{user.promo}</td>
                                <td class="p-4">
                                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-bg-secondary text-text-secondary border border-border">
                                        {user.role}
                                    </span>
                                </td>
                                <td class="p-4">
                                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase 
                                        {user.statut_cotisation?.includes('cotisant') ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'} border">
                                        {user.statut_cotisation || 'Non Cotisant'}
                                    </span>
                                </td>
                                <td class="p-4 text-right font-mono font-bold {user.solde < 0 ? 'text-error' : 'text-success'}">
                                    {user.solde.toFixed(2)} €
                                </td>
                                <td class="p-4 text-right">
                                    <button 
                                        onclick={() => editUser(user)}
                                        class="p-2 hover:bg-bg-secondary rounded-lg text-text-muted hover:text-text-primary transition-colors"
                                    >
                                        <Icon name="Edit2" size={16} />
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}

    {#if activeTab === 'perms'}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" in:fade>
            <!-- Add Perm Card -->
            <button
                type="button"
                onclick={createPerm}
                class="bg-bg-card border border-border border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-4 hover:bg-bg-secondary transition-colors cursor-pointer group min-h-[200px]"
            >
                <div class="w-16 h-16 rounded-full bg-brand-yellow/10 group-hover:bg-brand-yellow/20 text-brand-yellow flex items-center justify-center transition-colors">
                    <Icon name="Plus" size={32} />
                </div>
                <div>
                     <h3 class="font-bold text-text-primary text-lg">Créer une perm</h3>
                     <p class="text-sm text-text-muted">Planifier une nouvelle session</p>
                </div>
            </button>

            <!-- Perm Cards -->
            {#each perms as perm}
                <div 
                    role="button"
                    tabindex="0"
                    onclick={() => openPerm(perm)}
                    onkeydown={(e) => e.key === 'Enter' && openPerm(perm)}
                    class="bg-bg-card border border-border rounded-3xl p-6 relative overflow-hidden group hover:border-brand-yellow/30 transition-all text-left w-full cursor-pointer"
                >
                    <div class="flex justify-between items-start mb-6">
                        <div class="p-3 bg-bg-secondary rounded-xl border border-border text-brand-yellow">
                            <Icon name="Calendar" size={24} />
                        </div>
                        <div class="flex gap-2 items-start">
                             {#if perm.is_open}
                                <span class="px-2 py-1 bg-success/20 text-success border border-success/20 rounded-lg text-[10px] font-bold uppercase tracking-widest animate-pulse">En cours</span>
                             {/if}
                             <button onclick={(e) => editPerm(e, perm)} class="p-2 -mr-2 -mt-2 hover:bg-bg-tertiary rounded-lg text-text-muted hover:text-text-primary transition-colors flex z-10">
                                <Icon name="Edit2" size={16} />
                             </button>
                        </div>
                    </div>
                    
                    <h3 class="text-2xl font-black text-text-primary mb-1 uppercase italic tracking-tighter">{perm.nom}</h3>
                    <p class="text-text-muted font-mono text-sm mb-6">{new Date(perm.date * 1000).toLocaleDateString()}</p>
                    
                    <div class="bg-bg-secondary rounded-xl p-4 flex justify-between items-center">
                        <div class="text-xs text-text-muted font-bold uppercase">Recettes</div>
                        <div class="font-mono font-bold text-text-primary">{formatCurrency(perm.total_vente || 0)}</div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

{#if showEditModal}
    <AdminUserModal 
        bind:show={showEditModal} 
        user={selectedUser} 
        onClose={closeModal} 
        onSuccess={loadUsers}
    />
{/if}

{#if showPermModal}
    <AdminPermModal
        bind:show={showPermModal}
        perm={selectedPerm}
        onClose={closeModal}
    />
{/if}

{#if showEditPermModal}
    <EditPermModal
        bind:show={showEditPermModal}
        perm={permToEdit}
        onClose={closeModal}
        onSuccess={loadPerms}
    />
{/if}
