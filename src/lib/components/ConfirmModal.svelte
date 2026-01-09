<script lang="ts">
	import Modal from './Modal.svelte';

	interface Props {
		show: boolean;
		title?: string;
		message: string;
		confirmText?: string;
		cancelText?: string;
		type?: 'info' | 'success' | 'error' | 'warning' | 'confirm';
		onConfirm: () => void | Promise<void>;
		onCancel?: () => void;
	}

	let {
		show = $bindable(false),
		title = 'Confirmation',
		message,
		confirmText = 'Confirmer',
		cancelText = 'Annuler',
		type = 'confirm',
		onConfirm,
		onCancel
	}: Props = $props();
</script>

<Modal
	bind:show
	{title}
	{type}
	{confirmText}
	{cancelText}
	{onConfirm}
	{onCancel}
>
	<p class="text-text-primary">{message}</p>
</Modal>
