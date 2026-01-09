<script lang="ts">
	import { type Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	interface Props {
		show: boolean;
		title?: string;
		icon?: string;
		type?: 'info' | 'success' | 'error' | 'warning' | 'confirm';
		confirmText?: string;
		cancelText?: string;
		onConfirm?: () => void | Promise<void>;
		onCancel?: () => void;
		children?: Snippet;
		wide?: boolean;
		confirmDisabled?: boolean;
		showCloseButton?: boolean;
		hideActions?: boolean;
	}

	let {
		show = $bindable(false),
		title = '',
		icon = '',
		type = 'info',
		confirmText = 'OK',
		cancelText = 'Annuler',
		onConfirm,
		onCancel,
		children,
		wide = false,
		confirmDisabled = false,
		showCloseButton = true,
		hideActions = false
	}: Props = $props();

	let dialogElement: HTMLDialogElement;
	let isProcessing = $state(false);

	$effect(() => {
		if (!dialogElement) return;

		if (show && !dialogElement.open) {
			dialogElement.showModal();
		} else if (!show && dialogElement.open) {
			dialogElement.close();
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		const active = document.activeElement as HTMLElement | null;

		if (e.key === 'Enter' && !isProcessing) {
			const tag = active?.tagName?.toUpperCase() || '';
			const isEditable = active?.isContentEditable;
			const ignoreEnter = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || isEditable;
			if (!ignoreEnter && typeof onConfirm === 'function') {
				e.preventDefault();
				void handleConfirm();
				return;
			}
		}

		if (e.key === 'Escape' && !isProcessing) {
			handleCancel();
		}
	}

	async function handleConfirm() {
		if (isProcessing) return;

		try {
			isProcessing = true;
			if (onConfirm) {
				await onConfirm();
			}
			show = false;
		} catch (error: unknown) {
			console.error('Erreur dans onConfirm:', error);
		} finally {
			isProcessing = false;
		}
	}

	function handleCancel() {
		if (isProcessing) return;

		if (onCancel) {
			onCancel();
		}
		show = false;
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === dialogElement && !isProcessing) {
			handleCancel();
		}
	}

	const typeConfig = $derived({
		info: { icon: 'Info', color: 'text-blue-500' },
		success: { icon: 'CheckCircle', color: 'text-green-500' },
		error: { icon: 'XCircle', color: 'text-red-500' },
		warning: { icon: 'AlertTriangle', color: 'text-yellow-500' },
		confirm: { icon: 'HelpCircle', color: 'text-blue-500' }
	}[type]);

	const displayIcon = $derived(icon || typeConfig.icon);
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialogElement}
	class="modal-dialog"
	onkeydown={handleKeydown}
	onclick={handleBackdropClick}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="modal-content {wide ? 'modal-content-wide' : ''}"
		role="group"
		tabindex="-1"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
	>
		{#if title || displayIcon}
			<div class="modal-header">
				<h2 class="modal-title">
					{#if displayIcon}
						<Icon name={displayIcon} size={24} class={typeConfig.color} />
					{/if}
					{title}
				</h2>
				{#if showCloseButton}
					<button class="close-btn" onclick={handleCancel} aria-label="Fermer">
						<Icon name="X" size={20} />
					</button>
				{/if}
			</div>
		{/if}

		<div class="modal-body">
			{#if children}
				{@render children()}
			{/if}
		</div>

		{#if !hideActions}
			<div class="modal-actions">
				{#if type === 'confirm'}
					<button
						type="button"
						onclick={handleCancel}
						disabled={isProcessing}
						class="btn-secondary"
					>
						{cancelText}
					</button>
					<button
						type="button"
						onclick={handleConfirm}
						disabled={isProcessing || confirmDisabled}
						class="btn-primary"
					>
						{isProcessing ? 'En cours...' : confirmText}
					</button>
				{:else}
					<button
						type="button"
						onclick={handleConfirm}
						disabled={isProcessing || confirmDisabled}
						class="btn-primary"
					>
						{isProcessing ? 'En cours...' : confirmText}
					</button>
				{/if}
			</div>
		{/if}
	</div>
</dialog>

<style>
	.modal-dialog {
		border: none;
		border-radius: 0.75rem;
		padding: 0;
		background: transparent;
		max-width: 90vw;
		max-height: 90vh;
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		margin: 0;
		z-index: 10050;
	}

	.modal-dialog::backdrop {
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
	}

	.modal-content {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		padding: 1.5rem;
		min-width: 400px;
		max-width: 600px;
		box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
		display: flex;
		flex-direction: column;
		max-height: 90vh;
	}

	.modal-content-wide {
		min-width: 600px;
		max-width: 800px;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
		flex-shrink: 0;
	}

	.modal-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
		color: var(--text-primary);
	}

	.close-btn {
		background: transparent;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 0.375rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.close-btn:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.modal-body {
		margin-bottom: 1.5rem;
		color: var(--text-secondary);
		overflow-y: auto;
		flex: 1;
		min-height: 0;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.btn-primary,
	.btn-secondary {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}

	.btn-primary {
		background: var(--brand-red);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #a82818;
	}

	.btn-secondary {
		background: var(--bg-tertiary);
		color: var(--text-primary);
		border: 1px solid var(--border);
	}

	.btn-secondary:hover:not(:disabled) {
		background: var(--bg-primary);
	}

	.btn-primary:disabled,
	.btn-secondary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 640px) {
		.modal-content,
		.modal-content-wide {
			min-width: auto;
			width: 90vw;
		}
	}
</style>
