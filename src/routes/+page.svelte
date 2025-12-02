<script lang="ts">
	import { goto } from '$app/navigation';
	import { session, defaultPrompts } from '$lib/stores/session';
	import { logs } from '$lib/stores/logs';
	import { get } from 'svelte/store';

	let url = $state('');
	let loading = $state(false);
	let error = $state('');
	let showPromptEditor = $state(false);
	let editablePrompt = $state(get(session).companyPrompt);
	let copyFeedback = $state('');

	async function copyToClipboard() {
		await navigator.clipboard.writeText(editablePrompt);
		copyFeedback = 'Copied!';
		setTimeout(() => (copyFeedback = ''), 2000);
	}

	function resetToDefault() {
		editablePrompt = defaultPrompts.company;
	}

	async function generateCompanyInfo() {
		if (!url.trim()) {
			error = 'Please enter a URL';
			return;
		}

		loading = true;
		error = '';

		const currentSession = get(session);

		// Log the request with system prompt
		logs.add({
			type: 'request',
			endpoint: '/api/company',
			data: {
				url: url.trim(),
				systemPrompt: editablePrompt,
				llmSettings: currentSession.llmSettings
			}
		});

		try {
			const response = await fetch('/api/company', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					url: url.trim(),
					systemPrompt: editablePrompt,
					llmSettings: currentSession.llmSettings
				})
			});

			const data = await response.json();

			if (!response.ok) {
				logs.add({
					type: 'error',
					endpoint: '/api/company',
					data: { error: data.error }
				});
				throw new Error(data.error || 'Failed to fetch company info');
			}

			// Log the response
			logs.add({
				type: 'response',
				endpoint: '/api/company',
				data: data
			});

			session.setCompany({
				name: data.name,
				description: data.description,
				url: url.trim()
			});
		} catch (e) {
			error = e instanceof Error ? e.message : 'An error occurred';
			logs.add({
				type: 'error',
				endpoint: '/api/company',
				data: { error: error }
			});
		} finally {
			loading = false;
		}
	}

	function savePrompt() {
		session.updateCompanyPrompt(editablePrompt);
		logs.add({
			type: 'info',
			endpoint: 'Company System Prompt',
			data: { systemPrompt: editablePrompt }
		});
		showPromptEditor = false;
	}
</script>

<svelte:head>
	<title>PromptLab - Company</title>
</svelte:head>

<div class="page">
	<div class="card">
		<div class="card-header">
			<div>
				<h1 class="card-title">Step 1: Company Info</h1>
				<p class="card-subtitle">Enter a company URL to extract information using AI</p>
			</div>
		</div>

		<div class="form-group">
			<label class="label" for="url">Company URL</label>
			<input
				id="url"
				type="url"
				class="input"
				placeholder="https://example.com"
				bind:value={url}
				disabled={loading}
			/>
		</div>

		{#if error}
			<div class="error-message">{error}</div>
		{/if}

		<div class="actions-inline">
			<button
				class="btn btn-primary"
				onclick={generateCompanyInfo}
				disabled={loading || !url.trim()}
			>
				{#if loading}
					<span class="spinner"></span>
					Analyzing...
				{:else}
					Generate Company Info
				{/if}
			</button>
		</div>
	</div>

	<div class="card">
		<div class="card-header collapsible-header" onclick={() => (showPromptEditor = !showPromptEditor)}>
			<div>
				<h2 class="card-title">System Prompt</h2>
				<p class="card-subtitle">Customize the instructions sent to the AI</p>
			</div>
			<span class="collapsible-icon" class:open={showPromptEditor}>▼</span>
		</div>

		{#if showPromptEditor}
			<div class="collapsible-content">
				<textarea
					class="textarea"
					bind:value={editablePrompt}
					rows="12"
				></textarea>
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

	{#if $session.company}
		<div class="card">
			<div class="card-header">
				<h2 class="card-title">Result</h2>
			</div>
			<div class="result-item">
				<div class="result-header">
					<span class="result-title">{$session.company.name}</span>
				</div>
				<p class="result-description">{$session.company.description}</p>
			</div>
			<div class="actions">
				<span></span>
				<button class="btn btn-primary" onclick={() => goto('/topics')}>
					Continue to Topics →
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.page {
		padding-bottom: 48px;
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
</style>
