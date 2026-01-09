<script>
    import "../app.css";
    import { onMount } from 'svelte';
    import { initTheme } from '$lib/theme.svelte';
    import Navbar from '$lib/components/Navbar.svelte';

    let { children } = $props();

    onMount(() => {
        initTheme();
    });
</script>

<Navbar />

<main class="min-h-[calc(100vh-4rem)]">
    {@render children()}
</main>
