<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { initTheme, toggleTheme, theme } from '$lib/theme.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { getAvatarUrl } from '$lib/theme-config';

	let { children } = $props();

	// Derived user state
	let user = $derived($page.data.user);
	let isAuthenticated = $derived(!!user);
	let isCercleux = $derived(user?.role === 'cercleux');
	let isCotisant = $derived(
		user?.statut_cotisation === 'cotisant_sans_alcool' ||
			user?.statut_cotisation === 'cotisant_avec_alcool'
	);

	// Check if current path is active
	const isActive = (path: string) => {
		if (path === '/') return $page.url.pathname === '/';
		return $page.url.pathname.startsWith(path);
	};

	onMount(() => {
		initTheme();
	});

	async function handleLogin() {
		// Connexion automatique avec les.roots
		window.location.href = '/dev/login-as?u=les.roots';
	}

	async function handleLogout() {
		window.location.href = '/dev/logout';
	}
</script>

<svelte:head>
	<title>Le Cercle - L'Elite de la Soif</title>
	<meta name="description" content="Le Cercle - Bar associatif EMSE" />
</svelte:head>

<!-- Navigation principale -->
<nav
	class="fixed top-0 left-0 w-full z-[100] transition-all duration-300 bg-black/40 backdrop-blur-md border-b border-white/5"
>
	<div class="max-w-[1800px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
		<!-- Logo et Nom -->
		<div class="flex items-center gap-3 shrink-0">
			<a href="/" class="flex items-center gap-3 group">
				<img
					src="/logo.png"
					alt="Le Cercle"
					class="h-10 w-auto transition-transform group-hover:scale-110"
				/>
				<span
					class="hidden sm:inline font-black text-lg tracking-tighter uppercase text-rose-500 underline decoration-2 underline-offset-4 decoration-rose-500/30 group-hover:decoration-rose-500 transition-all"
				>
					Le Cercle
				</span>
			</a>
		</div>

		<!-- Navigation Links - Desktop -->
		<div class="hidden md:flex items-center gap-1 flex-1 justify-center">
			<a
				href="/"
				class="px-4 py-2 rounded-lg text-sm font-medium transition-all {isActive('/')
					? 'bg-white/10 text-white'
					: 'text-slate-400 hover:text-white hover:bg-white/5'}"
			>
				<div class="flex items-center gap-2">
					<Icon name="Home" size={18} />
					<span>Accueil</span>
				</div>
			</a>

			{#if isAuthenticated}
				<!-- Page Service - accessible à tous les connectés -->
				<a
					href="/serve"
					class="px-4 py-2 rounded-lg text-sm font-medium transition-all {isActive('/serve')
						? 'bg-white/10 text-white'
						: 'text-slate-400 hover:text-white hover:bg-white/5'}"
				>
					<div class="flex items-center gap-2">
						<Icon name="Store" size={18} />
						<span>Service</span>
					</div>
				</a>

				{#if isCercleux}
					<!-- Carte - uniquement pour les cercleux -->
					<a
						href="/carte"
						class="px-4 py-2 rounded-lg text-sm font-medium transition-all {isActive('/carte')
							? 'bg-white/10 text-white'
							: 'text-slate-400 hover:text-white hover:bg-white/5'}"
					>
						<div class="flex items-center gap-2">
							<Icon name="BookOpen" size={18} />
							<span>Carte</span>
						</div>
					</a>
				{/if}

				{#if isCotisant}
					<!-- Profil - uniquement pour les cotisants -->
					<a
						href="/profile"
						class="px-4 py-2 rounded-lg text-sm font-medium transition-all {isActive('/profile')
							? 'bg-white/10 text-white'
							: 'text-slate-400 hover:text-white hover:bg-white/5'}"
					>
						<div class="flex items-center gap-2">
							<Icon name="User" size={18} />
							<span>Profil</span>
						</div>
					</a>
				{/if}

				{#if isCercleux}
					<!-- Recharge - uniquement pour les cercleux -->
					<a
						href="/recharge"
						class="px-4 py-2 rounded-lg text-sm font-medium transition-all {isActive('/recharge')
							? 'bg-white/10 text-white'
							: 'text-slate-400 hover:text-white hover:bg-white/5'}"
					>
						<div class="flex items-center gap-2">
							<Icon name="PlusCircle" size={18} />
							<span>Recharge</span>
						</div>
					</a>

					<!-- Admin - uniquement pour les cercleux -->
					<a
						href="/admin"
						class="px-4 py-2 rounded-lg text-sm font-medium transition-all {isActive('/admin')
							? 'bg-white/10 text-white'
							: 'text-slate-400 hover:text-white hover:bg-white/5'}"
					>
						<div class="flex items-center gap-2">
							<Icon name="Shield" size={18} />
							<span>Admin</span>
						</div>
					</a>
				{/if}
			{/if}
		</div>

		<!-- Actions utilisateur -->
		<div class="flex items-center gap-3 shrink-0">
			<!-- Toggle thème -->
			<button
				onclick={toggleTheme}
				class="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-all"
				aria-label="Toggle theme"
			>
				<Icon name={theme.current === 'dark' ? 'Sun' : 'Moon'} size={18} />
			</button>

			{#if isAuthenticated && user}
				<!-- Infos utilisateur desktop -->
				<div class="hidden lg:flex flex-col items-end">
					<span class="text-xs font-bold text-rose-500 uppercase tracking-tighter"
						>{user.role}</span
					>
					<span class="text-[10px] text-slate-500 font-mono">{user.solde.toFixed(2)} €</span>
				</div>

				<!-- Avatar cliquable -->
				<div class="relative group">
					<button class="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-white/5 transition-all">
						<div
							class="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center font-bold text-sm shadow-lg shadow-rose-500/20"
						>
							<img
								src={getAvatarUrl(user.firstname, user.lastname, user.photo_url)}
								alt={user.firstname}
								class="w-full h-full object-cover"
							/>
						</div>
						<span class="hidden xl:inline text-sm font-medium text-white"
							>{user.firstname} {user.lastname}</span
						>
					</button>

					<!-- Menu déroulant -->
					<div
						class="absolute right-0 top-full mt-2 w-48 bg-bg-card border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all"
					>
						<div class="p-2 border-b border-white/5">
							<div class="px-3 py-2">
								<p class="text-xs text-text-muted">Connecté en tant que</p>
								<p class="text-sm font-bold text-text-primary truncate">{user.login}</p>
							</div>
						</div>
						<div class="p-2">
							{#if isCotisant}
								<a
									href="/profile"
									class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-text-primary text-sm transition-all"
								>
									<Icon name="User" size={16} />
									Mon Profil
								</a>
							{/if}
							<button
								onclick={handleLogout}
								class="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-500 text-sm transition-all"
							>
								<Icon name="LogOut" size={16} />
								Déconnexion
							</button>
						</div>
					</div>
				</div>
			{:else}
				<!-- Bouton de connexion -->
				<button
					onclick={handleLogin}
					class="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2 rounded-full font-bold text-sm transition-all shadow-lg shadow-rose-600/20 active:scale-95"
				>
					Connexion
				</button>
			{/if}
		</div>
	</div>
</nav>

<!-- Navigation mobile en bas -->
{#if isAuthenticated}
	<nav
		class="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[100] bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50"
	>
		<div class="h-16 flex justify-around items-center px-1">
			<a
				href="/"
				class="flex flex-col items-center gap-1 p-2 transition-all relative {isActive('/')
					? 'text-white'
					: 'text-slate-400'}"
			>
				<Icon name="Home" size={20} />
				<span class="text-[10px] font-bold uppercase tracking-widest">Accueil</span>
				{#if isActive('/')}
					<div
						class="absolute -top-1 w-1 h-1 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)]"
					></div>
				{/if}
			</a>

			<a
				href="/serve"
				class="flex flex-col items-center gap-1 p-2 transition-all relative {isActive('/serve')
					? 'text-white'
					: 'text-slate-400'}"
			>
				<Icon name="Store" size={20} />
				<span class="text-[10px] font-bold uppercase tracking-widest">Carte</span>
				{#if isActive('/serve')}
					<div
						class="absolute -top-1 w-1 h-1 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)]"
					></div>
				{/if}
			</a>

			{#if isCotisant}
				<a
					href="/profile"
					class="flex flex-col items-center gap-1 p-2 transition-all relative {isActive(
						'/profile'
					)
						? 'text-white'
						: 'text-slate-400'}"
				>
					<div
						class="w-6 h-6 rounded-lg overflow-hidden border border-white/20 {isActive('/profile')
							? 'ring-2 ring-rose-500'
							: ''}"
					>
						<img
							src={getAvatarUrl(user.firstname, user.lastname, user.photo_url)}
							alt="Profil"
							class="w-full h-full object-cover"
						/>
					</div>
					<span class="text-[10px] font-bold uppercase tracking-widest">Profil</span>
				</a>
			{/if}

			{#if isCercleux}
				<a
					href="/admin"
					class="flex flex-col items-center gap-1 p-2 transition-all relative {isActive('/admin')
						? 'text-white'
						: 'text-slate-400'}"
				>
					<Icon name="Shield" size={20} />
					<span class="text-[10px] font-bold uppercase tracking-widest">Admin</span>
					{#if isActive('/admin')}
						<div
							class="absolute -top-1 w-1 h-1 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)]"
						></div>
					{/if}
				</a>
			{/if}
		</div>
	</nav>
{/if}

<main class="min-h-screen pt-16">
	{@render children()}
</main>
