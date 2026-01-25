<script lang="ts">
	import { signIn, signOut } from '@auth/sveltekit/client';
	import { page } from '$app/stores'; // Using stores for Svelte 4/5 compatibility if state not ready, but user has Svelte 5.
	// However, MiGallery used $app/state everywhere? No, MiGallery used page from $app/state in snippets I saw?
	// Let's stick to $page store for safety or $state logic if I'm sure.
	// MiGallery layout used: `import { page } from "$app/state";`
	// So I should use $app/state if available.
	// But page.data is reactive?
	import { page as pageState } from '$app/state';
	// Or old store way:
	// import { page } from "$app/stores";

	// Let's use standard $page store as it's safer for now across projects unless configured for runes mode specifically.
	// Actually MiGallery used `import { page } from "$app/state";` which implies Svelte 5 Runes mode.
	// I will use that.

	import { LogIn, LogOut, Warehouse, Shield } from 'lucide-svelte';
	import type { AuthUser } from '$lib/auth-utils';

	let u = $derived(pageState.data?.user as AuthUser | undefined);
	let isAdmin = $derived(u?.role === 'cercleux');
	let isAuthenticated = $derived(!!u);
</script>

<nav class="topbar">
	<div class="brand">
		<a href="/">Le Cercle</a>
	</div>

	<div class="links">
		{#if isAuthenticated}
			<div class="links-left">
				<a href="/menu">
					<Warehouse size={18} />
					<span>Menu</span>
				</a>
			</div>

			<div class="links-right">
				{#if isAdmin}
					<a href="/admin">
						<Shield size={18} />
						<span>Admin</span>
					</a>
				{/if}
			</div>
		{/if}
	</div>

	<div class="user">
		{#if u}
			<span class="user-name">{u.firstname} {u.lastname}</span>
			<button class="btn-logout" onclick={() => signOut()} aria-label="Déconnexion">
				<LogOut size={18} />
			</button>
		{:else}
			<button class="btn-login" onclick={() => signIn('cas-emse')} aria-label="Connexion">
				<LogIn size={18} /> Connexion
			</button>
		{/if}
	</div>
</nav>
