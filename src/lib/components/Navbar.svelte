<script lang="ts">
	import { page as pageState } from '$app/state';
	import type { DBUser } from '$lib/db/types';

	import { LogIn, LogOut, Warehouse, Shield } from 'lucide-svelte';

	let u = $derived(pageState.data?.user as DBUser | undefined);
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
				<a href="/matchs">
					<Warehouse size={18} />
					<span>Matchs</span>
				</a>
			</div>
		{/if}
	</div>

	<div class="user">
		{#if u}
			<span class="user-name">{u.prenom} {u.nom}</span>
			<form action="/auth/logout" method="POST">
				<button type="submit" class="btn-logout" aria-label="Déconnexion">
					<LogOut size={18} />
				</button>
			</form>
		{:else}
			<a href="/auth/login" class="btn-login" aria-label="Connexion">
                <LogIn size={18} /> Connexion
            </a>
		{/if}
	</div>
</nav>
