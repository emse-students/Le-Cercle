<script lang="ts">
  import { theme } from '$lib/theme.svelte';
  
  let { variant = 'default', class: className = '' } = $props<{
    variant?: 'default' | 'minimal' | 'gradient';
    class?: string;
  }>();
</script>

<div class="fixed inset-0 overflow-hidden pointer-events-none -z-10 {className}">
  {#if variant === 'default'}
    <!-- Animated Orbs -->
    <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-red/20 dark:bg-rose-600/20 rounded-full blur-[120px] animate-pulse"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-yellow/10 dark:bg-amber-500/10 rounded-full blur-[140px]" style="animation: bounce-slow 8s infinite"></div>
    
    <!-- Subtle Grid Pattern -->
    <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-20 brightness-50 contrast-150"></div>
  {:else if variant === 'minimal'}
    <!-- Minimal subtle gradient -->
    <div class="absolute inset-0 bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-tertiary"></div>
  {:else if variant === 'gradient'}
    <!-- Rich gradient for special pages -->
    <div class="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-brand-red/5 to-transparent dark:from-rose-600/10"></div>
    <div class="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-brand-yellow/5 to-transparent dark:from-amber-500/5"></div>
  {/if}
</div>

<style>
  @keyframes bounce-slow {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-30px);
    }
  }
</style>
