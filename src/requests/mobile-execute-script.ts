import { Request } from './request';
import { Tool } from '../enums/tool';
import { z } from 'zod';

const mobileExecuteScriptSchema = z.object({
	script: z.string().describe('JavaScript code to execute'),
});

export class MobileExecuteScript extends Request<
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
		return await this.driver.getConnection().execute(request.script);
	}
}
