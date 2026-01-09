export const theme = $state({
    current: 'light'
});

export function toggleTheme() {
    theme.current = theme.current === 'light' ? 'dark' : 'light';
    if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme.current);
        localStorage.setItem('theme', theme.current);
    }
}

export function initTheme() {
    if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('theme');
        if (stored) {
            theme.current = stored;
            document.documentElement.setAttribute('data-theme', stored);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            theme.current = 'dark';
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }
}
