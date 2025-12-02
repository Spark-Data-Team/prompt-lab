import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	const { companyName, companyDescription, count, systemPrompt } = await request.json();

	if (!companyName || !companyDescription) {
		return json({ error: 'Company name and description are required' }, { status: 400 });
	}

	if (!env.OPENAI_API_KEY) {
		return json({ error: 'OpenAI API key not configured' }, { status: 500 });
	}

	const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

	// Replace {count} placeholder in the prompt
	const finalPrompt = systemPrompt.replace(/\{count\}/g, String(count || 5));

	try {
		const response = await client.responses.create({
			model: 'gpt-5-mini',
			input: [
				{
					role: 'developer',
					content: [{ type: 'input_text', text: finalPrompt }]
				},
				{
					role: 'user',
					content: [
						{
							type: 'input_text',
							text: `Entreprise : ${companyName}\n\nDescription : ${companyDescription}`
						}
					]
				}
			],
			text: {
				format: {
					type: 'json_schema',
					name: 'topics_list',
					schema: {
						type: 'object',
						properties: {
							items: {
								type: 'array',
								items: {
									type: 'object',
									properties: {
										topic: { type: 'string' },
										suggestions: { type: 'string' }
									},
									required: ['topic', 'suggestions'],
									additionalProperties: false
								}
							}
						},
						required: ['items'],
						additionalProperties: false
					},
					strict: true
				}
			}
		});

		const outputText = response.output_text;
		const parsed = JSON.parse(outputText);

		// Add unique IDs to topics
		const topics = parsed.items.map((item: { topic: string; suggestions: string }, index: number) => ({
			id: `topic-${Date.now()}-${index}`,
			topic: item.topic,
			suggestions: item.suggestions
		}));

		return json({ topics });
	} catch (error) {
		console.error('OpenAI API error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to generate topics' },
			{ status: 500 }
		);
	}
};
