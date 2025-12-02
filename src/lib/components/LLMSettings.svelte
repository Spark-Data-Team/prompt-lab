<script lang="ts">
	import { session, type ModelChoice, type LevelChoice } from '$lib/stores/session';

	const models: { value: ModelChoice; label: string }[] = [
		{ value: 'gpt-5-nano', label: 'gpt-5-nano' },
		{ value: 'gpt-5-mini', label: 'gpt-5-mini' },
		{ value: 'gpt-5', label: 'gpt-5' }
	];

	const levels: { value: LevelChoice; label: string }[] = [
		{ value: 'low', label: 'Low' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'high', label: 'High' }
	];
</script>

<div class="llm-settings">
	<h3>LLM Settings</h3>

	<div class="setting-row">
		<label>Model</label>
		<div class="button-group">
			{#each models as model}
				<button
					class="option-btn"
					class:active={$session.llmSettings.model === model.value}
					onclick={() => session.updateLLMSettings({ model: model.value })}
				>
					{model.label}
				</button>
			{/each}
		</div>
	</div>

	<div class="setting-row">
		<label>Reasoning</label>
		<div class="button-group">
			{#each levels as level}
				<button
					class="option-btn"
					class:active={$session.llmSettings.reasoning === level.value}
					onclick={() => session.updateLLMSettings({ reasoning: level.value })}
				>
					{level.label}
				</button>
			{/each}
		</div>
	</div>

	<div class="setting-row">
		<label>Verbosity</label>
		<div class="button-group">
			{#each levels as level}
				<button
					class="option-btn"
					class:active={$session.llmSettings.verbosity === level.value}
					onclick={() => session.updateLLMSettings({ verbosity: level.value })}
				>
					{level.label}
				</button>
			{/each}
		</div>
	</div>

	<div class="setting-row">
		<label>Search Context</label>
		<div class="button-group">
			{#each levels as level}
				<button
					class="option-btn"
					class:active={$session.llmSettings.searchContextSize === level.value}
					onclick={() => session.updateLLMSettings({ searchContextSize: level.value })}
				>
					{level.label}
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.llm-settings {
		padding: 16px;
		border-bottom: 1px solid var(--color-border);
	}

	h3 {
		margin: 0 0 12px 0;
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.setting-row {
		margin-bottom: 12px;
	}

	.setting-row:last-child {
		margin-bottom: 0;
	}

	label {
		display: block;
		font-size: 12px;
		color: var(--color-text-muted);
		margin-bottom: 6px;
	}

	.button-group {
		display: flex;
		gap: 4px;
	}

	.option-btn {
		flex: 1;
		padding: 6px 8px;
		font-size: 11px;
		background: var(--color-surface-elevated);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		color: var(--color-text-muted);
		cursor: pointer;
		transition: all 0.15s;
	}

	.option-btn:hover {
		background: var(--color-surface);
		color: var(--color-text);
	}

	.option-btn.active {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: white;
	}
</style>
