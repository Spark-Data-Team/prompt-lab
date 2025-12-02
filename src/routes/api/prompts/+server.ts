import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	const {
		topicName,
		companyName,
		companyDescription,
		count,
		brandDiscoveryPrompt,
		organicMentionPrompt
	} = await request.json();

	if (!topicName || !companyName || !companyDescription) {
		return json({ error: 'Topic and company info are required' }, { status: 400 });
	}

	if (!env.OPENAI_API_KEY) {
		return json({ error: 'OpenAI API key not configured' }, { status: 500 });
	}

	const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

	// Calculate 70/30 split
	const totalCount = count || 10;
	const brandDiscoveryCount = Math.round(totalCount * 0.7);
	const organicCount = totalCount - brandDiscoveryCount;

	// Replace placeholders
	const replacePlaceholders = (prompt: string, promptCount: number) => {
		return prompt
			.replace(/\{count\}/g, String(promptCount))
			.replace(/\{topic\}/g, topicName)
			.replace(/\{company\}/g, companyName);
	};

	const userContent = `Topic : ${topicName}\n\nSecteur d'activité de l'entreprise (ADAPTE les prompts à ce secteur) :\n- Nom : ${companyName}\n- Activité : ${companyDescription}`;

	try {
		// Run both generations in parallel
		const [brandDiscoveryResponse, organicResponse] = await Promise.all([
			client.responses.create({
				model: 'gpt-5-mini',
				input: [
					{
						role: 'developer',
						content: [{ type: 'input_text', text: replacePlaceholders(brandDiscoveryPrompt, brandDiscoveryCount) }]
					},
					{
						role: 'user',
						content: [{ type: 'input_text', text: userContent }]
					}
				],
				text: {
					format: {
						type: 'json_schema',
						name: 'prompts_list',
						schema: {
							type: 'object',
							properties: {
								prompts: {
									type: 'array',
									items: {
										type: 'object',
										properties: {
											prompt: { type: 'string' },
											tag: { type: 'string' }
										},
										required: ['prompt', 'tag'],
										additionalProperties: false
									}
								}
							},
							required: ['prompts'],
							additionalProperties: false
						},
						strict: true
					}
				}
			}),
			client.responses.create({
				model: 'gpt-5-mini',
				input: [
					{
						role: 'developer',
						content: [{ type: 'input_text', text: replacePlaceholders(organicMentionPrompt, organicCount) }]
					},
					{
						role: 'user',
						content: [{ type: 'input_text', text: userContent }]
					}
				],
				text: {
					format: {
						type: 'json_schema',
						name: 'prompts_list',
						schema: {
							type: 'object',
							properties: {
								prompts: {
									type: 'array',
									items: {
										type: 'object',
										properties: {
											prompt: { type: 'string' },
											tag: { type: 'string' }
										},
										required: ['prompt', 'tag'],
										additionalProperties: false
									}
								}
							},
							required: ['prompts'],
							additionalProperties: false
						},
						strict: true
					}
				}
			})
		]);

		const brandDiscoveryParsed = JSON.parse(brandDiscoveryResponse.output_text);
		const organicParsed = JSON.parse(organicResponse.output_text);

		// Combine and add IDs
		const allPrompts = [
			...brandDiscoveryParsed.prompts.slice(0, brandDiscoveryCount).map(
				(p: { prompt: string; tag: string }, i: number) => ({
					id: `prompt-bd-${Date.now()}-${i}`,
					prompt: p.prompt,
					tag: p.tag,
					type: 'brand-discovery'
				})
			),
			...organicParsed.prompts.slice(0, organicCount).map(
				(p: { prompt: string; tag: string }, i: number) => ({
					id: `prompt-om-${Date.now()}-${i}`,
					prompt: p.prompt,
					tag: p.tag,
					type: 'organic-mention'
				})
			)
		];

		return json({ prompts: allPrompts });
	} catch (error) {
		console.error('OpenAI API error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to generate prompts' },
			{ status: 500 }
		);
	}
};
