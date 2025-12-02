<script lang="ts">
	import { goto } from '$app/navigation';
	import { session, defaultPrompts } from '$lib/stores/session';
	import { logs } from '$lib/stores/logs';
	import { get } from 'svelte/store';

	let topicCount = $state(5);
	let loading = $state(false);
	let error = $state('');
	let showPromptEditor = $state(false);
	let editablePrompt = $state(get(session).topicsPrompt);
	let copyFeedback = $state('');

	async function copyToClipboard() {
		await navigator.clipboard.writeText(editablePrompt);
		copyFeedback = 'Copied!';
		setTimeout(() => (copyFeedback = ''), 2000);
	}

	function resetToDefault() {
		editablePrompt = defaultPrompts.topics;
	}

	async function generateTopics() {
		const currentSession = get(session);
		if (!currentSession.company) {
			error = 'Please complete Step 1 first';
			return;
		}

		loading = true;
		error = '';

		const requestData = {
			companyName: currentSession.company.name,
			companyDescription: currentSession.company.description,
			count: topicCount,
			systemPrompt: editablePrompt
		};

		logs.add({
			type: 'request',
			endpoint: '/api/topics',
			data: requestData
		});

		try {
			const response = await fetch('/api/topics', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestData)
			});

			const data = await response.json();

			if (!response.ok) {
				logs.add({
					type: 'error',
					endpoint: '/api/topics',
					data: { error: data.error }
				});
				throw new Error(data.error || 'Failed to generate topics');
			}

			logs.add({
				type: 'response',
				endpoint: '/api/topics',
				data: data
			});

			session.setTopics(data.topics);
		} catch (e) {
			error = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}

	function savePrompt() {
		session.updateTopicsPrompt(editablePrompt);
		showPromptEditor = false;
	}
</script>

<svelte:head>
	<title>PromptLab - Topics</title>
</svelte:head>

<div class="page">
	{#if !$session.company}
		<div class="card">
			<div class="empty-state">
				<div class="empty-state-icon">🏢</div>
				<div class="empty-state-title">No company selected</div>
				<p>Please complete Step 1 first to add a company.</p>
				<button class="btn btn-primary" style="margin-top: 16px" onclick={() => goto('/')}>
					← Go to Step 1
				</button>
			</div>
		</div>
	{:else}
		<div class="card">
			<div class="card-header">
				<div>
					<h1 class="card-title">Step 2: Generate Topics</h1>
					<p class="card-subtitle">Generate strategic topics for {$session.company.name}</p>
				</div>
			</div>

			<div class="company-summary">
				<strong>{$session.company.name}</strong>
				<p>{$session.company.description}</p>
			</div>

			<div class="form-group">
				<label class="label" for="count">Number of Topics</label>
				<input
					id="count"
					type="number"
					class="input"
					min="1"
					max="20"
					bind:value={topicCount}
					disabled={loading}
					style="max-width: 120px"
				/>
			</div>

			{#if error}
				<div class="error-message">{error}</div>
			{/if}

			<div class="actions-inline">
				<button
					class="btn btn-primary"
					onclick={generateTopics}
					disabled={loading}
				>
					{#if loading}
						<span class="spinner"></span>
						Generating...
					{:else}
						Generate Topics
					{/if}
				</button>
			</div>
		</div>

		<div class="card">
			<div class="card-header collapsible-header" onclick={() => (showPromptEditor = !showPromptEditor)}>
				<div>
					<h2 class="card-title">System Prompt</h2>
					<p class="card-subtitle">Customize the instructions for topic generation</p>
				</div>
				<span class="collapsible-icon" class:open={showPromptEditor}>▼</span>
			</div>

			{#if showPromptEditor}
				<div class="collapsible-content">
					<textarea
						class="textarea"
						bind:value={editablePrompt}
						rows="20"
					></textarea>
					<p class="hint">Use {'{count}'} as placeholder for the number of topics</p>
					<div class="prompt-actions">
						<button class="btn btn-secondary btn-sm" onclick={copyToClipboard}>
							{copyFeedback || 'Copy'}
						</button>
						<button class="btn btn-secondary btn-sm" onclick={resetToDefault}>
							Reset to Default
						</button>
						<button class="btn btn-primary btn-sm" onclick={savePrompt}>
							Save
						</button>
					</div>
				</div>
			{/if}
		</div>

		{#if $session.topics.length > 0}
			<div class="card">
				<div class="card-header">
					<h2 class="card-title">Generated Topics ({$session.topics.length})</h2>
				</div>

				{#each $session.topics as topic, i}
					<div class="result-item">
						<div class="result-header">
							<span class="result-title">{i + 1}. {topic.topic}</span>
						</div>
						<p class="result-description">{topic.suggestions}</p>
					</div>
				{/each}

				<div class="actions">
					<button class="btn btn-secondary" onclick={() => goto('/')}>
						← Back to Company
					</button>
					<button class="btn btn-primary" onclick={() => goto('/prompts')}>
						Continue to Prompts →
					</button>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.page {
		padding-bottom: 48px;
	}

	.company-summary {
		background: var(--color-surface-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: 16px;
		margin-bottom: 20px;
	}

	.company-summary strong {
		display: block;
		margin-bottom: 8px;
	}

	.company-summary p {
		color: var(--color-text-muted);
		font-size: 14px;
		margin: 0;
	}

	.error-message {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #ef4444;
		padding: 12px 16px;
		border-radius: 8px;
		margin-bottom: 16px;
		font-size: 14px;
	}

	.actions-inline {
		display: flex;
		gap: 12px;
	}

	.prompt-actions {
		display: flex;
		gap: 8px;
		margin-top: 12px;
	}

	.hint {
		font-size: 12px;
		color: var(--color-text-muted);
		margin-top: 8px;
	}
</style>
