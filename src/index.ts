#!/usr/bin/env node

import packageInfo from '../package.json';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import handlers from './handlers';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new McpServer({
	name: packageInfo.name,
	version: packageInfo.version,
});


// Register all tools.
for(const [toolName, handler] of Object.entries(handlers)) {
	server.registerTool(toolName, handler.info, async (args) => {
		try {
			const result: any = await handler.handle(args as any);

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

			console.error(`Error using tool ${toolName}:`, error);

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
}

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error('Device Farm MCP Server running');
}

try {
	await main();
} catch (error) {
	console.error('Fatal error in main():', error);
	process.exit(1);
}
