<script lang="ts">
    import Icon from '$lib/components/Icon.svelte';
    
    // Mock user for now
    let user = {
        firstname: "Lucas",
        lastname: "Etudiant",
        email: "lucas.etudiant@mines-stetienne.fr",
        balance: 1450, // 14.50€
        role: "user"
    };

    let transactions = [
        { id: 1, type: 'purchase', description: 'Pinte Blonde', amount: -350, date: '07/01/2026', perm: 'Soirée Inté', quantity: 1, product: 'Chouffe' },
        { id: 2, type: 'purchase', description: 'Snack', amount: -150, date: '07/01/2026', perm: 'Perm Midi', quantity: 1, product: 'Chips' },
        { id: 3, type: 'recharge', description: 'Rechargement CB', amount: 2000, date: '05/01/2026', perm: 'Bureau', quantity: 1, product: 'Recharge' },
        { id: 4, type: 'purchase', description: 'Pinte Rouge', amount: -400, date: '04/01/2026', perm: 'Soirée Noel', quantity: 2, product: 'Kasteel Rouge' },
    ];

    function formatCurrency(cents: number) {
        return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
    }
</script>

<div class="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
    
    <!-- Profile Header -->
    <div class="bg-bg-card rounded-2xl p-6 shadow-sm border border-brand-red/10 flex flex-col md:flex-row items-center gap-6">
        <div class="w-24 h-24 rounded-full bg-brand-yellow text-brand-dark flex items-center justify-center text-3xl font-bold border-4 border-bg-secondary">
            {user.firstname[0]}{user.lastname[0]}
        </div>
        <div class="text-center md:text-left flex-1">
            <h1 class="text-2xl font-bold">{user.firstname} {user.lastname}</h1>
            <p class="text-text-muted">{user.email}</p>
            <span class="inline-block mt-2 px-3 py-1 bg-brand-red/10 text-brand-red rounded-full text-xs font-bold uppercase tracking-wide">
                {user.role}
            </span>
        </div>
        <div class="bg-brand-dark text-white p-6 rounded-xl min-w-[200px] text-center">
            <div class="text-sm opacity-80 mb-1">Solde actuel</div>
            <div class="text-3xl font-bold text-brand-yellow">{formatCurrency(user.balance)}</div>
        </div>
    </div>

    <!-- Actions Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button class="bg-brand-red hover:bg-red-700 text-white p-4 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 h-16">
            <Icon name="PlusCircle" />
            Recharger mon compte
        </button>
        <button class="bg-bg-card hover:bg-bg-secondary text-text-primary border border-border p-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 h-16">
            <Icon name="Settings" />
            Paramètres
        </button>
    </div>

    <!-- History -->
    <div class="bg-bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div class="p-6 border-b border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 class="font-bold text-xl">Historique</h2>
            
            <!-- Date Filters (Placeholder UI) -->
            <div class="flex items-center gap-2 text-sm bg-bg-secondary/50 p-1 rounded-lg">
                <input type="date" class="bg-transparent border-none outline-none text-text-muted px-2" value="2026-01-01">
                <span class="text-text-muted">à</span>
                <input type="date" class="bg-transparent border-none outline-none text-text-muted px-2" value="2026-01-31">
            </div>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-bg-secondary/50 text-text-muted text-sm border-b border-border">
                        <th class="p-4 font-medium">Date</th>
                        <th class="p-4 font-medium">Perm</th>
                        <th class="p-4 font-medium">Produit</th>
                        <th class="p-4 font-medium text-center">Qté</th>
                        <th class="p-4 font-medium text-right">Montant</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-border">
                    {#each transactions as tx}
                        <tr class="hover:bg-bg-secondary/20 transition-colors">
                            <td class="p-4 text-sm text-text-muted font-mono">{tx.date}</td>
                            <td class="p-4 font-medium">{tx.perm}</td>
                            <td class="p-4 flex items-center gap-2">
                                <div class="w-6 h-6 rounded-full flex items-center justify-center {tx.type === 'recharge' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-brand-red'}">
                                    <Icon name={tx.type === 'recharge' ? 'ArrowDownLeft' : 'Beer'} size={12} />
                                </div>
                                {tx.product}
                            </td>
                            <td class="p-4 text-center text-text-muted">{tx.quantity}</td>
                            <td class="p-4 text-right font-bold font-mono {tx.amount > 0 ? 'text-green-600' : 'text-text-primary'}">
                                {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</div>
