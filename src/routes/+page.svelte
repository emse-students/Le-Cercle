<script>
    import Icon from '$lib/components/Icon.svelte';
</script>

<div class="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] px-6 py-12 text-center relative overflow-hidden">
    
    <!-- Background element (abstract logo shapes) -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none -z-10 flex items-center justify-center opacity-[0.03] dark:opacity-[0.05]">
        <div class="w-[800px] h-[800px] bg-brand-red rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3"></div>
        <div class="w-[600px] h-[600px] bg-brand-yellow rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3"></div>
    </div>

    <!-- Hero Section -->
    <div class="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div class="inline-flex items-center justify-center mb-6">
            <img src="/logo.png" alt="Logo Le Cercle" class="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300" />
        </div>

        <h1 class="text-5xl md:text-7xl font-black tracking-tighter text-balance leading-[1.1] underline decoration-4 decoration-current underline-offset-8 text-brand-red uppercase">
            Le Cercle
        </h1>
        
        <p class="text-xl md:text-2xl text-text-muted max-w-2xl mx-auto text-balance font-light italic">
            "La pression on ne la subit pas, <span class="text-brand-red font-medium">on la boit</span>"
        </p>
    </div>

    <!-- Quick Stats / Info Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
        <a href="/carte" class="group relative bg-bg-secondary p-8 rounded-xl shadow-md border border-border hover:border-brand-yellow/50 transition-all hover:shadow-lg hover:-translate-y-1 overflow-hidden">
            <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon name="Beer" size={64} />
            </div>
            
            <div class="flex flex-col items-start gap-4">
                <div class="w-14 h-14 bg-brand-yellow/20 rounded-lg flex items-center justify-center text-brand-yellow-hover group-hover:bg-brand-yellow group-hover:text-black transition-colors">
                    <Icon name="Beer" size={28} />
                </div>
                <div class="text-left">
                    <h3 class="font-bold text-2xl mb-2 text-text-primary group-hover:text-brand-yellow-hover transition-colors">La Carte</h3>
                    <p class="text-text-muted">Nos bières, softs et snacks du moment.</p>
                </div>
            </div>
        </a>

        <a href="/profile" class="group relative bg-bg-secondary p-8 rounded-xl shadow-md border border-border hover:border-brand-red/50 transition-all hover:shadow-lg hover:-translate-y-1 overflow-hidden">
            <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon name="CreditCard" size={64} />
            </div>
            
            <div class="flex flex-col items-start gap-4">
                <div class="w-14 h-14 bg-brand-red/20 rounded-lg flex items-center justify-center text-brand-red group-hover:bg-brand-red group-hover:text-white transition-colors">
                    <Icon name="CreditCard" size={28} />
                </div>
                <div class="text-left">
                    <h3 class="font-bold text-2xl mb-2 text-text-primary group-hover:text-brand-red transition-colors">Mon Solde</h3>
                    <p class="text-text-muted">Gérez votre compte et rechargez.</p>
                </div>
            </div>
        </a>
    </div>
</div>
