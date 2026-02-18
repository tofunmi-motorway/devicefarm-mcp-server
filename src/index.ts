#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import handlers from './handlers';
import { Tool } from './enums/tool';
import { Request } from './requests/request';
import { z } from 'zod';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({ name: 'devicefarm', version: '1.0.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
	tools: Object.values(handlers).map((handler) => handler.info),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name: tool, arguments: args } = request.params;
	const handler: Request<Tool, z.ZodTypeAny> = handlers[tool as Tool];

	try {
		// throw an error if handler is not found for tool.
		if (!handler) {
			throw new Error(`Unknown tool: ${tool}`);
		}

		const result = await handler.handle(args);

		return {
			content: [
				{
					type: 'text',
					text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
				},
			],
		};
	} catch (rawError) {
		const error = rawError as Error;

		return {
			content: [
				{
					type: 'text',
					text: `Error: ${error.message}`
				},
			],
			isError: true
		};
	}
});

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

try {
	await main();
} catch (error) {
	console.error(error);
}
