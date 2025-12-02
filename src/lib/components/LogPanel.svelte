<script lang="ts">
	import { logs } from '$lib/stores/logs';

	let isOpen = $state(true);
	let expandedLogs = $state<Set<string>>(new Set());

	function toggleLog(id: string) {
		if (expandedLogs.has(id)) {
			expandedLogs.delete(id);
		} else {
			expandedLogs.add(id);
		}
		expandedLogs = new Set(expandedLogs);
	}

	function formatTime(date: Date): string {
		return date.toLocaleTimeString('fr-FR', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	function getTypeColor(type: string): string {
		switch (type) {
			case 'request':
				return '#3b82f6';
			case 'response':
				return '#22c55e';
			case 'error':
				return '#ef4444';
			default:
				return '#8b5cf6';
		}
	}

	function getTypeIcon(type: string): string {
		switch (type) {
			case 'request':
				return '→';
			case 'response':
				return '←';
			case 'error':
				return '✕';
			default:
				return 'ℹ';
		}
	}
</script>

<div class="log-panel" class:collapsed={!isOpen}>
	<button class="toggle-btn" onclick={() => (isOpen = !isOpen)}>
		{isOpen ? '→' : '←'}
		{#if !isOpen}
			<span class="toggle-label">Logs</span>
		{/if}
	</button>

	{#if isOpen}
		<div class="panel-content">
			<div class="panel-header">
				<h3>Logs</h3>
				<button class="clear-btn" onclick={() => logs.clear()}>Clear</button>
			</div>

			<div class="logs-container">
				{#if $logs.length === 0}
					<div class="empty-logs">No logs yet</div>
				{:else}
					{#each $logs as log}
						<div class="log-entry" onclick={() => log.data && toggleLog(log.id)}>
							<div class="log-header">
								<span class="log-icon" style="color: {getTypeColor(log.type)}">
									{getTypeIcon(log.type)}
								</span>
								<span class="log-time">{formatTime(log.timestamp)}</span>
								<span class="log-endpoint">{log.endpoint}</span>
								{#if log.data}
									<span class="expand-icon">{expandedLogs.has(log.id) ? '▼' : '▶'}</span>
								{/if}
							</div>
							{#if log.data && expandedLogs.has(log.id)}
								<pre class="log-data">{JSON.stringify(log.data, null, 2)}</pre>
							{/if}
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.log-panel {
		position: fixed;
		top: 0;
		right: 0;
		height: 100vh;
		width: 400px;
		background: var(--color-surface);
		border-left: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		z-index: 100;
		transition: width 0.2s ease;
	}

	.log-panel.collapsed {
		width: 48px;
	}

	.toggle-btn {
		position: absolute;
		left: -1px;
		top: 50%;
		transform: translateY(-50%);
		width: 24px;
		height: 64px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-right: none;
		border-radius: 8px 0 0 8px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: var(--color-text-muted);
		font-size: 12px;
		gap: 4px;
	}

	.toggle-btn:hover {
		color: var(--color-text);
		background: var(--color-surface-elevated);
	}

	.toggle-label {
		writing-mode: vertical-rl;
		text-orientation: mixed;
		font-size: 10px;
	}

	.panel-content {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px;
		border-bottom: 1px solid var(--color-border);
	}

	.panel-header h3 {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
	}

	.clear-btn {
		background: none;
		border: 1px solid var(--color-border);
		padding: 4px 12px;
		border-radius: 4px;
		font-size: 12px;
		cursor: pointer;
		color: var(--color-text-muted);
	}

	.clear-btn:hover {
		background: var(--color-surface-elevated);
		color: var(--color-text);
	}

	.logs-container {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
	}

	.empty-logs {
		color: var(--color-text-muted);
		text-align: center;
		padding: 32px;
		font-size: 13px;
	}

	.log-entry {
		background: var(--color-surface-elevated);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		margin-bottom: 8px;
		overflow: hidden;
	}

	.log-header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		cursor: pointer;
		font-size: 12px;
	}

	.log-header:hover {
		background: rgba(255, 255, 255, 0.02);
	}

	.log-icon {
		font-weight: bold;
		width: 16px;
		text-align: center;
	}

	.log-time {
		color: var(--color-text-muted);
		font-family: monospace;
		font-size: 11px;
	}

	.log-endpoint {
		flex: 1;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.expand-icon {
		color: var(--color-text-muted);
		font-size: 10px;
	}

	.log-data {
		background: rgba(0, 0, 0, 0.2);
		padding: 12px;
		margin: 0;
		font-size: 11px;
		font-family: monospace;
		overflow-x: auto;
		border-top: 1px solid var(--color-border);
		white-space: pre-wrap;
		word-break: break-all;
		max-height: 300px;
		overflow-y: auto;
	}
</style>
