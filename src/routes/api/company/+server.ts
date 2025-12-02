import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	const { url, systemPrompt, llmSettings } = await request.json();

	if (!url) {
		return json({ error: 'URL is required' }, { status: 400 });
	}

	if (!env.OPENAI_API_KEY) {
		return json({ error: 'OpenAI API key not configured' }, { status: 500 });
	}

	const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

	// Default settings if not provided
	const model = llmSettings?.model || 'gpt-5-mini';
	const reasoning = llmSettings?.reasoning || 'low';
	const searchContextSize = llmSettings?.searchContextSize || 'low';

	try {
		const response = await client.responses.create({
			model,
			reasoning: { effort: reasoning },
			input: [
				{
					role: 'developer',
					content: [{ type: 'input_text', text: systemPrompt }]
				},
				{
					role: 'user',
					content: [{ type: 'input_text', text: `URL: ${url}` }]
				}
			],
			text: {
				format: {
					type: 'json_schema',
					name: 'company_info',
					schema: {
						type: 'object',
						properties: {
							name: { type: 'string', description: 'Company name' },
							description: { type: 'string', description: 'Company description in French' }
						},
						required: ['name', 'description'],
						additionalProperties: false
					},
					strict: true
				}
			},
			tools: [
				{
					type: 'web_search',
					user_location: { type: 'approximate', country: 'FR' },
					search_context_size: searchContextSize
				}
			]
		});

		const outputText = response.output_text;
		const parsed = JSON.parse(outputText);

		return json({
			name: parsed.name,
			description: parsed.description,
			url
		});
	} catch (error) {
		console.error('OpenAI API error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch company info' },
			{ status: 500 }
		);
	}
};
