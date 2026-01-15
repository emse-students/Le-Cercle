// Theme configuration and utilities for Le Cercle
// Centralized theme values and helper functions

export const themeColors = {
	light: {
		bgPrimary: '#efe7d9',
		bgSecondary: '#e6dac6',
		bgTertiary: '#dccdb3',
		bgCard: '#f9f4ef',

		textPrimary: '#1a1918',
		textSecondary: '#4a453e',
		textMuted: '#78736b',

		brandRed: '#c8331e',
		brandRedHover: '#a62a19',
		brandYellow: '#fecb00',
		brandYellowHover: '#e5b800',

		success: '#10b981',
		error: '#ef4444',
		info: '#3b82f6',

		border: '#d6c6a8',
		borderHover: '#c4b08d'
	},
	dark: {
		bgPrimary: '#0f0e0d',
		bgSecondary: '#1a1817',
		bgTertiary: '#292624',
		bgCard: '#1c1a19',

		textPrimary: '#f5f5f4',
		textSecondary: '#a8a29e',
		textMuted: '#57534e',

		brandRed: '#f43f5e',
		brandRedHover: '#e11d48',
		brandYellow: '#fbbf24',
		brandYellowHover: '#d97706',

		success: '#10b981',
		error: '#ef4444',
		info: '#3b82f6',

		border: '#292624',
		borderHover: '#44403c'
	}
} as const;

export const themeClasses = {
	card: 'bg-bg-card border border-white/5 dark:border-white/10',
	cardHover:
		'hover:bg-bg-secondary hover:border-white/10 dark:hover:border-white/20 transition-all',
	button: {
		primary:
			'bg-brand-red hover:bg-brand-red-hover text-white font-bold transition-all shadow-lg shadow-brand-red/20 active:scale-95',
		secondary:
			'bg-bg-card border border-white/5 text-text-primary hover:bg-bg-secondary transition-all',
		ghost: 'hover:bg-white/5 text-text-secondary hover:text-text-primary transition-all'
	},
	input:
		'bg-bg-card border border-border focus:border-brand-red outline-none text-text-primary transition-colors',
	glass: 'bg-white/5 dark:bg-black/40 backdrop-blur-md border border-white/5 dark:border-white/10'
} as const;

// Helper to format currency
export function formatCurrency(amount: number): string {
	return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

// Helper to get initials from name
export function getInitials(firstname: string, lastname: string): string {
	return `${firstname[0] || ''}${lastname[0] || ''}`.toUpperCase();
}

// Helper to get avatar URL
export function getAvatarUrl(
	firstname: string,
	lastname: string,
	photoUrl?: string | null
): string {
	if (photoUrl) {
		return photoUrl;
	}
	return `https://ui-avatars.com/api/?name=${firstname}+${lastname}&background=c8331e&color=fff&bold=true`;
}
