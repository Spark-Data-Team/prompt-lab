<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { session } from '$lib/stores/session';
	import LogPanel from '$lib/components/LogPanel.svelte';

	let { children } = $props();

	const steps = [
		{ path: '/', label: 'Company', number: 1 },
		{ path: '/topics', label: 'Topics', number: 2 },
		{ path: '/prompts', label: 'Prompts', number: 3 }
	];

	function getStepStatus(step: typeof steps[0], currentPath: string, sessionData: typeof $session) {
		if (step.path === currentPath) return 'active';

		// Check if step is completed based on session data
		if (step.number === 1 && sessionData.company) return 'completed';
		if (step.number === 2 && sessionData.topics.length > 0) return 'completed';
		if (step.number === 3 && sessionData.prompts.length > 0) return 'completed';

		return '';
	}
</script>

<div class="app">
	<header class="header container">
		<a href="/" class="logo">Prompt<span>Lab</span></a>
		<button class="btn btn-secondary btn-sm" onclick={() => session.reset()}>
			Reset Session
		</button>
	</header>

	<nav class="stepper">
		{#each steps as step, i}
			{#if i > 0}
				<div class="step-connector"></div>
			{/if}
			<a
				href={step.path}
				class="step {getStepStatus(step, $page.url.pathname, $session)}"
			>
				<span class="step-number">{step.number}</span>
				<span>{step.label}</span>
			</a>
		{/each}
	</nav>

	<main class="container">
		{@render children()}
	</main>
</div>

<LogPanel />

<style>
	.app {
		min-height: 100vh;
		margin-right: 400px;
		transition: margin-right 0.2s ease;
	}

	:global(.log-panel.collapsed) ~ .app,
	:global(body:has(.log-panel.collapsed)) .app {
		margin-right: 48px;
	}
</style>
