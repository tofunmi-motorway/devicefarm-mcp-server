import type { Context } from '@wdio/protocols';
import { AppiumDetailedCrossPlatformContexts } from 'webdriverio';
import { z } from 'zod';
import { BaseTool } from '../base-tool';
import { Tool } from '../../enums/tool';

const mobileGetContextsSchema = z.object({});

export class MobileGetContexts extends BaseTool<
	Tool.MOBILE_GET_CONTEXTS,
	typeof mobileGetContextsSchema
> {
	public readonly info = {
		name: Tool.MOBILE_GET_CONTEXTS,
		description: 'List available contexts (NATIVE_APP, WEBVIEW)',
		inputSchema: mobileGetContextsSchema,
	} as const;

	/**
	 * Handle mobile get contexts request.
	 */
	public async handle(): Promise<Context[] | AppiumDetailedCrossPlatformContexts> {
		return await (await this.driver.getConnection()).getContexts();
	}
}
