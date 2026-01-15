<script lang="ts">
    import * as icons from 'lucide-svelte';
    
    let { name, class: className = "", size = 24, ...rest }: any = $props();

    // Normaliser le nom : première lettre en majuscule, reste tel quel ou PascalCase
    // Lucide svelte attend du PascalCase. Si on reçoit "beer", on veut "Beer".
    // Si on reçoit "glass-water", on veut "GlassWater".
    function toPascalCase(str: string) {
        if (!str) return "";
        
        // Si le nom contient des tirets ou des espaces, on transforme en PascalCase
        if (str.includes('-') || str.includes('_') || str.includes(' ')) {
            return str
                .split(/[-_ ]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join("");
        }
        
        // Sinon on s'assure juste que la première lettre est en majuscule
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    const iconName = $derived(toPascalCase(name));
</script>

{#if icons[iconName as keyof typeof icons]}
    {@const IconComponent = icons[iconName as keyof typeof icons] as any}
    <IconComponent class={className} {size} {...rest} />
{:else}
    <!-- Fallback si l'icone n'existe pas -->
    <icons.HelpCircle class={className} {size} {...rest} />
{/if}
