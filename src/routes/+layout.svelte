<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	// Assumes $lib/theme.svelte exists (it was in the import list of original file)
	import { initTheme } from '$lib/theme.svelte';
	import Navbar from '$lib/components/Navbar.svelte';

	let { children } = $props();

	onMount(() => {
		initTheme();
	});
</script>

<svelte:head>
	<title>Le Cercle - L'Elite de la Soif</title>
	<meta name="description" content="Le Cercle - Bar associatif EMSE" />
</svelte:head>

<Navbar />

<main>
	{@render children()}
</main>
