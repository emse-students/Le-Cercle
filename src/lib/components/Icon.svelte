<script lang="ts">
    import * as icons from 'lucide-svelte';
    
    let { name, class: className = "", size = 24, ...rest }: any = $props();
</script>

{#if icons[name as keyof typeof icons]}
    {@const IconComponent = icons[name as keyof typeof icons] as any}
    <IconComponent class={className} {size} {...rest} />
{/if}
