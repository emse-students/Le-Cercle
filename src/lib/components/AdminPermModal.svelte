<script lang="ts">
    import Modal from './Modal.svelte';
    import Icon from './Icon.svelte';
    import { formatCurrency } from '$lib/theme-config';

    interface Props {
        show: boolean;
        perm: any;
        onClose: () => void;
    }

    let { show = $bindable(false), perm, onClose }: Props = $props();
    let transactions = $state<any[]>([]);
    let loading = $state(false);

    $effect(() => {
        if (show && perm) {
            loadStats();
        }
    });

    async function loadStats() {
        loading = true;
        try {
            const res = await fetch(`/api/perms/${perm.id}/stats`);
            if (res.ok) {
                transactions = await res.json();
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    // Calcul des stats à partir des transactions
    const stats = $derived.by(() => {
        const statsMap = new Map<string, {
            nom: string,
            contenant: string,
            count: number,
            total_litre: number,
            total_prix: number
        }>();

        for (const t of transactions) {
            const isBoisson = t.type === 'B';
            const key = `${t.type}_${t.id_item}`;
            
            if (!statsMap.has(key)) {
                statsMap.set(key, {
                    nom: t.item_nom || 'Inconnu',
                    contenant: isBoisson ? (t.contenant_nom || '-') : 'Unité',
                    count: 0,
                    total_litre: 0,
                    total_prix: 0
                });
            }
            
            const entry = statsMap.get(key)!;
            entry.count += t.nb;
            entry.total_prix += Math.abs(t.prix);
            if (isBoisson && t.contenant_capacite) {
                entry.total_litre += (t.nb * t.contenant_capacite);
            }
        }

        return Array.from(statsMap.values()).sort((a, b) => b.total_prix - a.total_prix);
    });

    const totalRecettes = $derived(stats.reduce((acc, curr) => acc + curr.total_prix, 0));
</script>

<Modal
    bind:show
    title={`Bilan - ${perm?.nom || 'Perm'}`}
    onCancel={onClose}
    hideActions={true}
>
    <div class="space-y-6">
        <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-bg-secondary rounded-xl border border-white/5 text-center">
                <div class="text-xs text-text-muted uppercase font-bold mb-1">Total Recettes</div>
                <div class="text-2xl font-black text-text-primary">{formatCurrency(totalRecettes)}</div>
            </div>
            <div class="p-4 bg-bg-secondary rounded-xl border border-white/5 text-center">
                <div class="text-xs text-text-muted uppercase font-bold mb-1">Articles Vendus</div>
                <div class="text-2xl font-black text-text-primary">{stats.reduce((acc, c) => acc + c.count, 0)}</div>
            </div>
        </div>

        <div class="overflow-hidden border border-white/5 rounded-xl">
            <table class="w-full text-left text-sm">
                <thead>
                    <tr class="bg-bg-secondary text-text-muted text-xs uppercase tracking-wide border-b border-white/5">
                        <th class="p-3">Qté</th>
                        <th class="p-3">Nom</th>
                        <th class="p-3">Contenant</th>
                        <th class="p-3 text-right">Volume</th>
                        <th class="p-3 text-right">Total</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    {#if loading}
                         <tr><td colspan="5" class="p-4 text-center">Chargement...</td></tr>
                    {:else if stats.length === 0}
                         <tr><td colspan="5" class="p-4 text-center text-text-muted">Aucune vente enregistrée.</td></tr>
                    {:else}
                        {#each stats as line}
                            <tr class="hover:bg-bg-secondary/50">
                                <td class="p-3 font-bold">{line.count}</td>
                                <td class="p-3 font-medium text-text-primary">{line.nom}</td>
                                <td class="p-3 text-text-muted">{line.contenant}</td>
                                <td class="p-3 text-right font-mono text-xs">{line.total_litre > 0 ? `${line.total_litre.toFixed(2)}L` : '-'}</td>
                                <td class="p-3 text-right font-bold font-mono">{formatCurrency(line.total_prix)}</td>
                            </tr>
                        {/each}
                    {/if}
                </tbody>
            </table>
        </div>
    </div>
</Modal>
