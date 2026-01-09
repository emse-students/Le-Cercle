
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/admin" | "/api" | "/api/boissons" | "/api/consommables" | "/api/perms" | "/api/perms/active" | "/api/recharge" | "/api/status" | "/api/transactions" | "/api/users" | "/dev" | "/dev/login-as" | "/dev/logout" | "/dev/recharge" | "/open-perm" | "/profile" | "/recharge" | "/serve";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>;
			"/admin": Record<string, never>;
			"/api": Record<string, never>;
			"/api/boissons": Record<string, never>;
			"/api/consommables": Record<string, never>;
			"/api/perms": Record<string, never>;
			"/api/perms/active": Record<string, never>;
			"/api/recharge": Record<string, never>;
			"/api/status": Record<string, never>;
			"/api/transactions": Record<string, never>;
			"/api/users": Record<string, never>;
			"/dev": Record<string, never>;
			"/dev/login-as": Record<string, never>;
			"/dev/logout": Record<string, never>;
			"/dev/recharge": Record<string, never>;
			"/open-perm": Record<string, never>;
			"/profile": Record<string, never>;
			"/recharge": Record<string, never>;
			"/serve": Record<string, never>
		};
		Pathname(): "/" | "/admin" | "/admin/" | "/api" | "/api/" | "/api/boissons" | "/api/boissons/" | "/api/consommables" | "/api/consommables/" | "/api/perms" | "/api/perms/" | "/api/perms/active" | "/api/perms/active/" | "/api/recharge" | "/api/recharge/" | "/api/status" | "/api/status/" | "/api/transactions" | "/api/transactions/" | "/api/users" | "/api/users/" | "/dev" | "/dev/" | "/dev/login-as" | "/dev/login-as/" | "/dev/logout" | "/dev/logout/" | "/dev/recharge" | "/dev/recharge/" | "/open-perm" | "/open-perm/" | "/profile" | "/profile/" | "/recharge" | "/recharge/" | "/serve" | "/serve/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}