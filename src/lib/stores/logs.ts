import { writable } from 'svelte/store';

export interface LogEntry {
	id: string;
	timestamp: Date;
	type: 'request' | 'response' | 'error' | 'info';
	endpoint: string;
	data?: unknown;
}

function createLogStore() {
	const { subscribe, update } = writable<LogEntry[]>([]);

	return {
		subscribe,
		add: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
			update((logs) => [
				{
					...entry,
					id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
					timestamp: new Date()
				},
				...logs
			].slice(0, 100)); // Keep last 100 logs
		},
		clear: () => update(() => [])
	};
}

export const logs = createLogStore();
