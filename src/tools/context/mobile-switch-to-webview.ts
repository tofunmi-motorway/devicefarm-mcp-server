import { BaseTool } from '../base-tool';
import { Tool } from '../../enums/tool';
import { z } from 'zod';

const mobileSwitchToWebviewSchema = z.object({});

export class MobileSwitchToWebview extends BaseTool<
	Tool.MOBILE_SWITCH_TO_WEBVIEW,
	typeof mobileSwitchToWebviewSchema
> {
	public readonly info = {
		name: Tool.MOBILE_SWITCH_TO_WEBVIEW,
		description: 'Switch to WebView context for web content interaction',
		inputSchema: mobileSwitchToWebviewSchema,
	} as const;

	/**
	 * Handle mobile switch to webview request.
	 */
	public async handle(): Promise<string> {
		const connection = await this.driver.getConnection();
		const contexts = await connection.getContexts();
		const webviewContext = contexts.find(ctx => String(ctx).includes('WEBVIEW'));

		if (!webviewContext) {
			throw new Error('No WebView context found. Available contexts: ' + contexts.join(', '));
		}

		await connection.switchContext(webviewContext);

		return `Switched to ${webviewContext}`;
	}
}
