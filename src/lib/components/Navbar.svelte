<script lang="ts">
    import { page } from '$app/stores';
    import { theme, toggleTheme } from '$lib/theme.svelte';
    import Icon from '$lib/components/Icon.svelte';

    let user = $page.data.user;

    // TODO: Connect this to real auth
    function login() {
        console.log("Login clicked");
        // Simulated login for design
        window.location.href = '/profile';
    }
</script>

<!-- Top Navbar -->
<nav class="fixed top-0 left-0 w-full bg-bg-primary border-b border-border z-50 h-14 px-4 flex items-center justify-between">
    <!-- Brand -->
    <a href="/" class="flex items-center gap-3 group">
        <img src="/logo.png" alt="Logo" class="w-8 h-8 object-contain" />
        <span class="font-black text-lg tracking-tight hidden sm:block text-brand-red decoration-brand-red underline decoration-2 underline-offset-4">LE CERCLE</span>
    </a>

    <!-- Desktop Links via center -->
    <div class="hidden md:flex items-center gap-6 font-medium text-sm text-text-secondary">
        <a href="/" class="hover:text-text-primary transition-colors">Accueil</a>
        <a href="/profile" class="hover:text-text-primary transition-colors">Mon Compte</a>
        <a href="/serve" class="hover:text-text-primary transition-colors">Service</a>
        <a href="/admin" class="hover:text-text-primary transition-colors">Admin</a>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2">
        <!-- User info (dev mode) -->
        {#if user}
            <a href="/dev/logout" class="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 rounded border border-yellow-500/40 hover:bg-yellow-500/30 transition-colors">
                {user.login} ({user.role})
            </a>
        {/if}
        
        <!-- Theme Toggle -->
        <button onclick={toggleTheme} class="p-2 rounded-lg hover:bg-bg-secondary transition-colors text-text-muted" aria-label="Toggle Theme">
            {#if theme.current === 'light'}
                <Icon name="Moon" size={18} />
            {:else}
                <Icon name="Sun" size={18} />
            {/if}
        </button>

        {#if user}
            <a href="/profile" class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-bg-secondary transition-colors">
                <span class="font-medium text-sm hidden sm:block text-text-secondary">{user.firstname}</span>
                <div class="w-7 h-7 rounded-full bg-bg-tertiary flex items-center justify-center font-bold text-xs text-text-primary">
                    {user.firstname[0]}{user.lastname[0]}
                </div>
            </a>
        {:else}
            <button onclick={login} class="bg-brand-red hover:bg-red-600 text-white px-4 py-1.5 rounded-lg font-medium transition-colors text-sm">
                Connexion
            </button>
        {/if}
    </div>
</nav>

<!-- Mobile Bottom Nav -->
<nav class="md:hidden fixed bottom-0 left-0 w-full bg-bg-primary border-t border-border pb-safe pt-2 px-2 flex justify-around items-center z-50 h-14">
    <a href="/" class="flex flex-col items-center gap-0.5 p-2 text-xs font-medium text-text-muted {$page.url.pathname === '/' ? 'text-brand-red' : ''}">
        <Icon name="Home" size={18} />
        <span>Accueil</span>
    </a>
    <a href="/serve" class="flex flex-col items-center gap-0.5 p-2 text-xs font-medium text-text-muted {$page.url.pathname === '/serve' ? 'text-brand-red' : ''}">
        <Icon name="Store" size={18} />
        <span>Service</span>
    </a>
    <a href="/admin" class="flex flex-col items-center gap-0.5 p-2 text-xs font-medium text-text-muted {$page.url.pathname === '/admin' ? 'text-brand-red' : ''}">
        <Icon name="Shield" size={18} />
        <span>Admin</span>
    </a>
    <a href="/profile" class="flex flex-col items-center gap-0.5 p-2 text-xs font-medium text-text-muted {$page.url.pathname === '/profile' ? 'text-brand-red' : ''}">
        <Icon name="User" size={18} />
        <span>Compte</span>
    </a>
</nav>

<!-- Spacers to prevent content hiding -->
<div class="h-14"></div> <!-- Top spacer -->
<div class="h-14 md:hidden"></div> <!-- Bottom spacer for mobile -->