<script lang="ts">
    import { onMount } from 'svelte';
    import Icon from '$lib/components/Icon.svelte';
    import PageBackground from '$lib/components/PageBackground.svelte';
    import UserSearch from '$lib/components/UserSearch.svelte';

    let perms = $state<any[]>([]);
    let loading = $state(true);
    let showCreateModal = $state(false);
    let showEditModal = $state(false);
    let editingPerm = $state<any>(null);
    
    // Formulaire création
    let newPermName = $state('');
    let newPermDate = $state(new Date().toISOString().split('T')[0]);
    let selectedBarmans = $state<any[]>([]);

    onMount(async () => {
        await loadPerms();
    });

    async function loadPerms() {
        loading = true;
        try {
            const res = await fetch('/api/perms');
            if (res.ok) {
                perms = await res.json();
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    async function createPerm() {
        if (!newPermName.trim()) {
            alert('Veuillez entrer un nom');
            return;
        }

        try {
            const year = new Date(newPermDate).getFullYear().toString();
            const res = await fetch('/api/perms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nom: newPermName, annee: year })
            });

            if (res.ok) {
                const { permId } = await res.json();
                
                // Assigner les barmans
                for (const barman of selectedBarmans) {
                    await fetch('/api/perms', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ permId, action: 'assign', userId: barman.id })
                    });
                }

                await loadPerms();
                closeCreateModal();
            }
        } catch (e) {
            console.error(e);
            alert('Erreur lors de la création');
        }
    }

    async function togglePerm(perm: any) {
        try {
            const action = perm.is_open ? 'close' : 'open';
            const res = await fetch('/api/perms', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ permId: perm.id, action })
            });

            if (res.ok) {
                await loadPerms();
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function deletePerm(id: number) {
        if (!confirm('Supprimer cette permanence ?')) return;

        try {
            const res = await fetch(`/api/perms?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                await loadPerms();
            }
        } catch (e) {
            console.error(e);
        }
    }

    function openCreateModal() {
        newPermName = '';
        newPermDate = new Date().toISOString().split('T')[0];
        selectedBarmans = [];
        showCreateModal = true;
    }

    function closeCreateModal() {
        showCreateModal = false;
    }

    function openEditModal(perm: any) {
        editingPerm = perm;
        showEditModal = true;
    }

    function closeEditModal() {
        showEditModal = false;
        editingPerm = null;
    }

    async function loadPermBarmans(permId: number) {
        const res = await fetch(`/api/perms/${permId}`);
        if (res.ok) {
            const data = await res.json();
            return data.barmans || [];
        }
        return [];
    }

    async function removeBarman(permId: number, userId: number) {
        await fetch('/api/perms', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ permId, action: 'remove', userId })
        });
        await loadPerms();
    }

    async function addBarman(permId: number, user: any) {
        await fetch('/api/perms', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ permId, action: 'assign', userId: user.id })
        });
        await loadPerms();
    }
</script>

<PageBackground variant="minimal" />

<div class="min-h-screen pt-24 pb-32 md:pb-20 px-4 max-w-6xl mx-auto">
    <header class="mb-10">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
                <div class="p-4 rounded-2xl bg-amber-500/10 text-amber-500">
                    <Icon name="CalendarCheck" size={32} />
                </div>
                <div>
                    <h1 class="text-4xl font-black uppercase tracking-tighter italic text-text-primary">
                        Permanences
                    </h1>
                    <p class="text-text-muted font-medium">Gérer les événements</p>
                </div>
            </div>
            <button
                onclick={openCreateModal}
                class="px-6 py-3 rounded-xl bg-brand-red text-white font-bold uppercase text-sm hover:bg-brand-red/90 transition-all"
            >
                <div class="flex items-center gap-2">
                    <Icon name="Plus" size={20} />
                    Nouvelle Perm
                </div>
            </button>
        </div>
    </header>

    {#if loading}
        <div class="flex items-center justify-center h-64">
            <Icon name="Loader2" class="animate-spin text-brand-red" size={48} />
        </div>
    {:else if perms.length === 0}
        <div class="text-center py-20">
            <div class="p-6 rounded-full bg-bg-card inline-block mb-4">
                <Icon name="CalendarOff" size={64} class="text-text-muted" />
            </div>
            <h3 class="text-xl font-bold text-text-primary mb-2">Aucune permanence</h3>
            <p class="text-text-muted mb-6">Créez votre première permanence</p>
            <button
                onclick={openCreateModal}
                class="px-6 py-3 rounded-xl bg-brand-red text-white font-bold uppercase text-sm hover:bg-brand-red/90 transition-all"
            >
                Créer une perm
            </button>
        </div>
    {:else}
        <div class="grid gap-4">
            {#each perms as perm (perm.id)}
                <div class="bg-bg-card border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <h3 class="text-xl font-bold text-text-primary">{perm.nom}</h3>
                                {#if perm.is_open}
                                    <span class="px-3 py-1 rounded-full bg-success/20 text-success text-xs font-bold uppercase">
                                        Ouverte
                                    </span>
                                {:else}
                                    <span class="px-3 py-1 rounded-full bg-text-muted/20 text-text-muted text-xs font-bold uppercase">
                                        Fermée
                                    </span>
                                {/if}
                            </div>
                            <p class="text-text-muted text-sm">
                                {new Date(perm.date * 1000).toLocaleDateString('fr-FR')} • {perm.annee}
                            </p>
                        </div>

                        <div class="flex items-center gap-2">
                            <button
                                onclick={() => togglePerm(perm)}
                                class="px-4 py-2 rounded-lg {perm.is_open ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-success/10 text-success hover:bg-success/20'} font-bold text-xs uppercase transition-all"
                            >
                                {perm.is_open ? 'Fermer' : 'Ouvrir'}
                            </button>
                            <button
                                onclick={() => openEditModal(perm)}
                                class="px-4 py-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary text-text-primary font-bold text-xs uppercase transition-all"
                            >
                                Modifier
                            </button>
                            <button
                                onclick={() => deletePerm(perm.id)}
                                class="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold text-xs uppercase transition-all"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<!-- Modal Création -->
{#if showCreateModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onclick={closeCreateModal}>
        <div class="bg-bg-card border border-white/10 rounded-2xl p-8 max-w-2xl w-full" onclick={(e) => e.stopPropagation()}>
            <h2 class="text-2xl font-bold text-text-primary mb-6">Nouvelle Permanence</h2>
            
            <div class="space-y-4 mb-6">
                <div>
                    <label class="block text-sm font-bold text-text-muted mb-2">Nom de l'événement</label>
                    <input
                        type="text"
                        bind:value={newPermName}
                        placeholder="Ex: Soirée Intégration 2026"
                        class="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-white/5 text-text-primary focus:outline-none focus:border-brand-red transition-colors"
                    />
                </div>

                <div>
                    <label class="block text-sm font-bold text-text-muted mb-2">Date</label>
                    <input
                        type="date"
                        bind:value={newPermDate}
                        class="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-white/5 text-text-primary focus:outline-none focus:border-brand-red transition-colors"
                    />
                </div>

                <div>
                    <label class="block text-sm font-bold text-text-muted mb-2">Barmans</label>
                    <UserSearch 
                        onSelect={(user) => {
                            if (!selectedBarmans.find(b => b.id === user.id)) {
                                selectedBarmans = [...selectedBarmans, user];
                            }
                        }}
                    />
                    <div class="mt-3 flex flex-wrap gap-2">
                        {#each selectedBarmans as barman}
                            <div class="px-3 py-1 rounded-lg bg-bg-secondary border border-white/5 text-text-primary flex items-center gap-2">
                                <span class="text-sm">{barman.prenom} {barman.nom}</span>
                                <button onclick={() => selectedBarmans = selectedBarmans.filter(b => b.id !== barman.id)} class="text-red-500 hover:text-red-400">
                                    <Icon name="X" size={16} />
                                </button>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>

            <div class="flex gap-3">
                <button
                    onclick={closeCreateModal}
                    class="flex-1 px-6 py-3 rounded-xl bg-bg-secondary hover:bg-bg-tertiary text-text-primary font-bold uppercase text-sm transition-all"
                >
                    Annuler
                </button>
                <button
                    onclick={createPerm}
                    class="flex-1 px-6 py-3 rounded-xl bg-brand-red hover:bg-brand-red/90 text-white font-bold uppercase text-sm transition-all"
                >
                    Créer
                </button>
            </div>
        </div>
    </div>
{/if}
