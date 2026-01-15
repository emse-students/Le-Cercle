<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '$lib/components/Icon.svelte';
  import PageBackground from '$lib/components/PageBackground.svelte';

  let isLoaded = $state(false);

  onMount(() => {
    isLoaded = true;
  });
</script>

<PageBackground variant="default" />

<div class="min-h-screen text-text-primary font-sans selection:bg-brand-red selection:text-white overflow-hidden relative">
  <div class="relative z-10 max-w-5xl mx-auto px-6 py-12 lg:py-24 pb-32 md:pb-24 flex flex-col items-center">
    
    <!-- --- HERO SECTION --- -->
    <header class="text-center space-y-8 transition-all duration-1000 transform {isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}">
      <div class="relative inline-block hover:scale-105 transition-transform duration-500">
        <!-- Main Logo -->
        <img src="/logo.png" alt="Logo Le Cercle" class="w-32 h-auto md:w-48 mx-auto drop-shadow-2xl" />
      </div>

      <div class="space-y-4">
        <h1 class="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-tight">
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500 decoration-rose-500/30 underline-offset-8">Le Cercle</span>
        </h1>
        <div class="flex items-center justify-center gap-2 text-rose-500/80 font-mono tracking-widest text-sm uppercase">
          <span class="h-[1px] w-8 bg-rose-500/40"></span>
          L'Elite de la Soif
          <span class="h-[1px] w-8 bg-rose-500/40"></span>
        </div>
        <p class="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-light italic leading-relaxed">
          "La pression on ne la subit pas, <span class="text-rose-500 font-medium not-italic">on la boit</span>"
        </p>
      </div>
    </header>

    <!-- --- QUICK ACTION CARDS --- -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-20 transition-all duration-1000 delay-300 transform {isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}">
      
      <!-- Menu Card -->
      <a href="/serve" class="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 transition-all duration-500 hover:bg-white/10 hover:border-amber-500/50 hover:-translate-y-2">
        <div class="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-colors"></div>
        
        <div class="flex flex-col h-full justify-between">
          <div class="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 mb-8 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-black transition-all duration-500">
            <Icon name="Beer" size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h3 class="text-3xl font-bold mb-2 group-hover:text-amber-400 transition-colors">La Carte</h3>
            <p class="text-slate-400 group-hover:text-slate-300 transition-colors">Découvrez nos pressions artisanales, cocktails signatures et snacks de terroir.</p>
          </div>
          <div class="mt-8 flex items-center text-amber-500 font-semibold gap-2">
            Voir le menu <Icon name="ChevronRight" size={20} class="group-hover:translate-x-2 transition-transform" />
          </div>
        </div>
      </a>

      <!-- Account Card -->
      <a href="/profile" class="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 transition-all duration-500 hover:bg-white/10 hover:border-rose-500/50 hover:-translate-y-2">
        <div class="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-colors"></div>
        
        <div class="flex flex-col h-full justify-between">
          <div class="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 mb-8 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all duration-500">
            <Icon name="CreditCard" size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h3 class="text-3xl font-bold mb-2 group-hover:text-rose-400 transition-colors">Mon Solde</h3>
            <p class="text-slate-400 group-hover:text-slate-300 transition-colors">Gérez vos jetons, rechargez votre compte et consultez votre historique de soif.</p>
          </div>
          <div class="mt-8 flex items-center text-rose-500 font-semibold gap-2">
            Accéder au profil <Icon name="ChevronRight" size={20} class="group-hover:translate-x-2 transition-transform" />
          </div>
        </div>
      </a>

    </div>

    <!-- --- SECONDARY INFO --- -->
    <div class="mt-16 w-full flex flex-wrap justify-center gap-8 text-slate-500 transition-all duration-1000 delay-500 {isLoaded ? 'opacity-100' : 'opacity-0'}">
      <div class="flex items-center gap-2 hover:text-rose-400 transition-colors cursor-default">
        <span class="text-sm font-medium">Bar étudiant - Maison des Élèves de l'école des Mines de Saint-Étienne</span>
      </div>
    </div>

  </div>
</div>