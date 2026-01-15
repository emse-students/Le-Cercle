
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
		RouteId(): "/" | "/admin" | "/api" | "/api/boissons" | "/api/boissons/[id]" | "/api/config" | "/api/config/items" | "/api/consommables" | "/api/consommables/[id]" | "/api/items" | "/api/perms" | "/api/perms/active" | "/api/perms/[id]" | "/api/perms/[id]/carte" | "/api/perms/[id]/stats" | "/api/recharge" | "/api/stats" | "/api/stats/global" | "/api/status" | "/api/transactions" | "/api/users" | "/api/users/[id]" | "/carte" | "/dev" | "/dev/login-as" | "/dev/logout" | "/dev/recharge" | "/open-perm" | "/profile" | "/recharge" | "/serve";
		RouteParams(): {
			"/api/boissons/[id]": { id: string };
			"/api/consommables/[id]": { id: string };
			"/api/perms/[id]": { id: string };
			"/api/perms/[id]/carte": { id: string };
			"/api/perms/[id]/stats": { id: string };
			"/api/users/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string };
			"/admin": Record<string, never>;
			"/api": { id?: string };
			"/api/boissons": { id?: string };
			"/api/boissons/[id]": { id: string };
			"/api/config": Record<string, never>;
			"/api/config/items": Record<string, never>;
			"/api/consommables": { id?: string };
			"/api/consommables/[id]": { id: string };
			"/api/items": Record<string, never>;
			"/api/perms": { id?: string };
			"/api/perms/active": Record<string, never>;
			"/api/perms/[id]": { id: string };
			"/api/perms/[id]/carte": { id: string };
			"/api/perms/[id]/stats": { id: string };
			"/api/recharge": Record<string, never>;
			"/api/stats": Record<string, never>;
			"/api/stats/global": Record<string, never>;
			"/api/status": Record<string, never>;
			"/api/transactions": Record<string, never>;
			"/api/users": { id?: string };
			"/api/users/[id]": { id: string };
			"/carte": Record<string, never>;
			"/dev": Record<string, never>;
			"/dev/login-as": Record<string, never>;
			"/dev/logout": Record<string, never>;
			"/dev/recharge": Record<string, never>;
			"/open-perm": Record<string, never>;
			"/profile": Record<string, never>;
			"/recharge": Record<string, never>;
			"/serve": Record<string, never>
		};
		Pathname(): "/" | "/admin" | "/admin/" | "/api" | "/api/" | "/api/boissons" | "/api/boissons/" | `/api/boissons/${string}` & {} | `/api/boissons/${string}/` & {} | "/api/config" | "/api/config/" | "/api/config/items" | "/api/config/items/" | "/api/consommables" | "/api/consommables/" | `/api/consommables/${string}` & {} | `/api/consommables/${string}/` & {} | "/api/items" | "/api/items/" | "/api/perms" | "/api/perms/" | "/api/perms/active" | "/api/perms/active/" | `/api/perms/${string}` & {} | `/api/perms/${string}/` & {} | `/api/perms/${string}/carte` & {} | `/api/perms/${string}/carte/` & {} | `/api/perms/${string}/stats` & {} | `/api/perms/${string}/stats/` & {} | "/api/recharge" | "/api/recharge/" | "/api/stats" | "/api/stats/" | "/api/stats/global" | "/api/stats/global/" | "/api/status" | "/api/status/" | "/api/transactions" | "/api/transactions/" | "/api/users" | "/api/users/" | `/api/users/${string}` & {} | `/api/users/${string}/` & {} | "/carte" | "/carte/" | "/dev" | "/dev/" | "/dev/login-as" | "/dev/login-as/" | "/dev/logout" | "/dev/logout/" | "/dev/recharge" | "/dev/recharge/" | "/open-perm" | "/open-perm/" | "/profile" | "/profile/" | "/recharge" | "/recharge/" | "/serve" | "/serve/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/logo.png" | string & {};
	}
}