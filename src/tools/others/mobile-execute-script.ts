import { BaseTool } from '../base-tool';
import { Tool } from '../../enums/tool';
import { z } from 'zod';

const mobileExecuteScriptSchema = z.object({
	script: z.string().describe('JavaScript code to execute'),
});

export class MobileExecuteScript extends BaseTool<
	Tool.MOBILE_EXECUTE_SCRIPT,
	typeof mobileExecuteScriptSchema
> {
	public readonly info = {
		name: Tool.MOBILE_EXECUTE_SCRIPT,
		description: 'Execute JavaScript in WebView context',
		inputSchema: mobileExecuteScriptSchema,
	} as const;

	/**
	 * Handle mobile execute script request.
	 */
	public async handle(request: z.infer<typeof mobileExecuteScriptSchema>): Promise<unknown> {
		return await (await this.driver.getConnection()).executeScript(request.script, []);
	}
}
