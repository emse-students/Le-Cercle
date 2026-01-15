<script lang="ts">
  import { page } from '$app/stores';
  import { theme, toggleTheme } from '$lib/theme.svelte';
  import Icon from '$lib/components/Icon.svelte';

  // Navigation items definition
  const navItems = [
    { label: 'Accueil', href: '/', icon: 'Home' },
    { label: 'Service', href: '/serve', icon: 'Store' },
    { label: 'Recharge', href: '/recharge', icon: 'PlusCircle', minRole: 'cercleux' },
    { label: 'Admin', href: '/admin', icon: 'Shield', minRole: 'cercleux' }
  ];

  // Logic to determine if a link is active
  const isActive = (path: string) => {
    if (path === '/') return $page.url.pathname === '/';
    return $page.url.pathname.startsWith(path);
  };

  // Get user from layout data
  let user = $derived($page.data.user);
</script>

<!-- --- TOP NAVBAR --- -->
<nav class="fixed top-0 left-0 w-full z-[100] transition-all duration-300">
  <div class="absolute inset-0 bg-black/40 backdrop-blur-md border-b border-white/5"></div>
  <div class="relative max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
    
    <!-- Brand -->
    <a href="/" class="flex items-center gap-3 group">
      <img src="/logo.png" alt="Le Cercle" class="h-10 w-auto transition-transform group-hover:scale-110" />
      <span class="font-black text-lg tracking-tighter uppercase text-rose-500 underline decoration-2 underline-offset-4 decoration-rose-500/30 group-hover:decoration-rose-500 transition-all">
        Le Cercle
      </span>
    </a>

    <!-- Desktop Nav -->
    <div class="hidden md:flex items-center gap-8 text-sm font-medium">
      {#each navItems as item}
        {#if !item.minRole || (user && (user.role === 'cercleux' || user.role === item.minRole))}
          <a 
            href={item.href} 
            class="transition-colors relative group {isActive(item.href) ? 'text-white' : 'text-slate-400 hover:text-white'}"
          >
            {item.label}
            <span class="absolute -bottom-1 left-0 h-0.5 bg-rose-500 transition-all {isActive(item.href) ? 'w-full' : 'w-0 group-hover:w-full'}"></span>
          </a>
        {/if}
      {/each}
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-3">
      <!-- Theme Toggle -->
      <button 
        onclick={toggleTheme}
        class="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-all"
        aria-label="Toggle theme"
      >
        <Icon name={theme.current === 'dark' ? 'Sun' : 'Moon'} size={18} />
      </button>

      {#if user}
        <div class="flex items-center gap-3 pl-3 border-l border-white/10">
          <div class="hidden lg:flex flex-col items-end">
            <span class="text-xs font-bold text-rose-500 uppercase tracking-tighter">{user.role}</span>
            <span class="text-[10px] text-slate-500 font-mono">{user.solde.toFixed(2)} €</span>
          </div>
          <a href="/profile" class="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center font-bold text-sm shadow-lg shadow-rose-500/20 group cursor-pointer hover:scale-105 transition-transform">
            {#if user.photo_url}
              <img src={user.photo_url} alt={user.firstname} class="w-full h-full object-cover" />
            {:else}
              <img 
                src="https://ui-avatars.com/api/?name={user.firstname}+{user.lastname}&background=f43f5e&color=fff&bold=true" 
                alt={user.firstname} 
                class="w-full h-full object-cover" 
              />
            {/if}
          </a>
        </div>
      {:else}
        <a href="/dev/login-as?u=admin" class="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2 rounded-full font-bold text-sm transition-all shadow-lg shadow-rose-600/20 active:scale-95">
          Connexion
        </a>
      {/if}
    </div>
  </div>
</nav>

<!-- --- MOBILE BOTTOM NAV --- -->
<nav class="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[100]">
  <div class="absolute inset-0 bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50"></div>
  <div class="relative h-16 flex justify-around items-center px-1">
    {#each navItems as item}
      {#if !item.minRole || (user && (user.role === 'cercleux' || user.role === item.minRole))}
        <a 
          href={item.href}
          class="flex flex-col items-center gap-1 p-2 transition-all relative {isActive(item.href) ? 'text-white' : 'text-slate-400 hover:text-white'}"
        >
          <Icon name={item.icon} size={20} />
          <span class="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
          {#if isActive(item.href)}
            <div class="absolute -top-1 w-1 h-1 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)]"></div>
          {/if}
        </a>
      {/if}
    {/each}
    
    {#if user}
      <a 
        href="/profile"
        class="flex flex-col items-center gap-1 p-2 transition-all relative {isActive('/profile') ? 'text-white' : 'text-slate-400 hover:text-white'}"
      >
        <div class="w-6 h-6 rounded-lg overflow-hidden border border-white/20 {isActive('/profile') ? 'ring-2 ring-rose-500' : ''}">
          <img 
            src={user.photo_url || `https://ui-avatars.com/api/?name=${user.firstname}+${user.lastname}&background=f43f5e&color=fff&bold=true`} 
            alt="Profil" 
            class="w-full h-full object-cover" 
          />
        </div>
        <span class="text-[10px] font-bold uppercase tracking-widest">Profil</span>
      </a>
    {/if}
  </div>
</nav>

<style>
</style>