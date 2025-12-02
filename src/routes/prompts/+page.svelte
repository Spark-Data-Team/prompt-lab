<script lang="ts">
	import { goto } from '$app/navigation';
	import { session, defaultPrompts } from '$lib/stores/session';
	import { logs } from '$lib/stores/logs';
	import { get } from 'svelte/store';

	let selectedTopicId = $state<string | null>(null);
	let promptCount = $state(10);
	let loading = $state(false);
	let error = $state('');
	let activeTab = $state<'brand' | 'organic'>('brand');
	let copyFeedback = $state('');

	const initialSession = get(session);
	let editableBrandPrompt = $state(initialSession.brandDiscoveryPrompt);
	let editableOrganicPrompt = $state(initialSession.organicMentionPrompt);

	async function copyToClipboard() {
		const text = activeTab === 'brand' ? editableBrandPrompt : editableOrganicPrompt;
		await navigator.clipboard.writeText(text);
		copyFeedback = 'Copied!';
		setTimeout(() => (copyFeedback = ''), 2000);
	}

	function resetToDefault() {
		if (activeTab === 'brand') {
			editableBrandPrompt = defaultPrompts.brandDiscovery;
		} else {
			editableOrganicPrompt = defaultPrompts.organicMention;
		}
	}

	// Get prompts for selected topic
	const selectedTopicPrompts = $derived(
		selectedTopicId
			? $session.prompts.filter((p) => p.topicId === selectedTopicId)
			: []
	);

	const selectedTopic = $derived(
		$session.topics.find((t) => t.id === selectedTopicId)
	);

	async function generatePrompts() {
		const currentSession = get(session);
		if (!currentSession.company || !selectedTopic) {
			error = 'Please select a topic';
			return;
		}

		loading = true;
		error = '';

		const requestData = {
			topicName: selectedTopic.topic,
			companyName: currentSession.company.name,
			companyDescription: currentSession.company.description,
			count: promptCount,
			brandDiscoveryPrompt: editableBrandPrompt,
			organicMentionPrompt: editableOrganicPrompt,
			llmSettings: currentSession.llmSettings
		};

		logs.add({
			type: 'request',
			endpoint: '/api/prompts',
			data: requestData
		});

		try {
			const response = await fetch('/api/prompts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestData)
			});

			const data = await response.json();

			if (!response.ok) {
				logs.add({
					type: 'error',
					endpoint: '/api/prompts',
					data: { error: data.error }
				});
				throw new Error(data.error || 'Failed to generate prompts');
			}

			logs.add({
				type: 'response',
				endpoint: '/api/prompts',
				data: data
			});

			// Add topic ID to prompts and save
			const promptsWithTopic = data.prompts.map((p: { id: string; prompt: string; tag: string }) => ({
				...p,
				topicId: selectedTopicId
			}));

			session.addPrompts(promptsWithTopic);
		} catch (e) {
			error = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}

	function savePrompts() {
		session.updateBrandDiscoveryPrompt(editableBrandPrompt);
		session.updateOrganicMentionPrompt(editableOrganicPrompt);
	}

	function getTagClass(tag: string): string {
		const normalized = tag.toLowerCase().replace(/[^a-z]/g, '-');
		return normalized;
	}
</script>

<svelte:head>
	<title>PromptLab - Prompts</title>
</svelte:head>

<div class="page">
	{#if !$session.company || $session.topics.length === 0}
		<div class="card">
			<div class="empty-state">
				<div class="empty-state-icon">📝</div>
				<div class="empty-state-title">
					{#if !$session.company}
						No company selected
					{:else}
						No topics generated
					{/if}
				</div>
				<p>Please complete the previous steps first.</p>
				<button
					class="btn btn-primary"
					style="margin-top: 16px"
					onclick={() => goto($session.company ? '/topics' : '/')}
				>
					← Go to {$session.company ? 'Topics' : 'Company'}
				</button>
			</div>
		</div>
	{:else}
		<div class="card">
			<div class="card-header">
				<div>
					<h1 class="card-title">Step 3: Generate Prompts</h1>
					<p class="card-subtitle">Generate search prompts for each topic</p>
				</div>
			</div>

			<div class="form-group">
				<label class="label">Select Topic</label>
				<div class="topic-selector">
					{#each $session.topics as topic}
						<button
							class="topic-chip"
							class:selected={selectedTopicId === topic.id}
							onclick={() => (selectedTopicId = topic.id)}
						>
							{topic.topic}
						</button>
					{/each}
				</div>
			</div>

			{#if selectedTopic}
				<div class="form-group">
					<label class="label" for="count">Prompts per Topic</label>
					<input
						id="count"
						type="number"
						class="input"
						min="1"
						max="50"
						bind:value={promptCount}
						disabled={loading}
						style="max-width: 120px"
					/>
					<p class="hint">70% Brand Discovery, 30% Organic Mention</p>
				</div>

				{#if error}
					<div class="error-message">{error}</div>
				{/if}

				<div class="actions-inline">
					<button
						class="btn btn-primary"
						onclick={generatePrompts}
						disabled={loading}
					>
						{#if loading}
							<span class="spinner"></span>
							Generating...
						{:else}
							Generate Prompts
						{/if}
					</button>
				</div>
			{/if}
		</div>

		<div class="card">
			<div class="card-header">
				<h2 class="card-title">System Prompts</h2>
			</div>

			<div class="tabs">
				<button
					class="tab"
					class:active={activeTab === 'brand'}
					onclick={() => (activeTab = 'brand')}
				>
					Brand Discovery (70%)
				</button>
				<button
					class="tab"
					class:active={activeTab === 'organic'}
					onclick={() => (activeTab = 'organic')}
				>
					Organic Mention (30%)
				</button>
			</div>

			{#if activeTab === 'brand'}
				<textarea
					class="textarea"
					bind:value={editableBrandPrompt}
					rows="20"
				></textarea>
			{:else}
				<textarea
					class="textarea"
					bind:value={editableOrganicPrompt}
					rows="20"
				></textarea>
			{/if}

			<p class="hint">
				Placeholders: {'{count}'} = number of prompts, {'{topic}'} = topic name, {'{company}'} = company name
			</p>

			<div class="prompt-actions">
				<button class="btn btn-secondary btn-sm" onclick={copyToClipboard}>
					{copyFeedback || 'Copy'}
				</button>
				<button class="btn btn-secondary btn-sm" onclick={resetToDefault}>
					Reset to Default
				</button>
				<button class="btn btn-primary btn-sm" onclick={savePrompts}>
					Save Both
				</button>
			</div>
		</div>

		{#if selectedTopicPrompts.length > 0}
			<div class="card">
				<div class="card-header">
					<h2 class="card-title">
						Generated Prompts for "{selectedTopic?.topic}" ({selectedTopicPrompts.length})
					</h2>
				</div>

				{#each selectedTopicPrompts as prompt}
					<div class="result-item">
						<div class="result-header">
							<span class="result-title">{prompt.prompt}</span>
							<span class="tag {getTagClass(prompt.tag)}">{prompt.tag}</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<div class="card">
			<div class="actions">
				<button class="btn btn-secondary" onclick={() => goto('/topics')}>
					← Back to Topics
				</button>
				<div class="prompts-summary">
					Total prompts: {$session.prompts.length}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.page {
		padding-bottom: 48px;
	}

	.tabs {
		display: flex;
		gap: 4px;
		margin-bottom: 16px;
		border-bottom: 1px solid var(--color-border);
	}

	.tab {
		padding: 12px 20px;
		background: none;
		border: none;
		color: var(--color-text-muted);
		font-size: 14px;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		transition: all 0.2s;
	}

	.tab:hover {
		color: var(--color-text);
	}

	.tab.active {
		color: var(--color-primary);
		border-bottom-color: var(--color-primary);
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

	.prompts-summary {
		color: var(--color-text-muted);
		font-size: 14px;
	}
</style>
