import { Request } from './request';
import { Tool } from '../enums/tool';
import { z } from 'zod';
import { Element } from 'webdriverio';

const mobileListAppsSchema = z.object({
	appId: z.string(),
});

export class MobileListApps extends Request<
	Tool.MOBILE_LIST_APPS,
	typeof mobileListAppsSchema
> {
	public readonly info = {
		name: Tool.MOBILE_LIST_APPS,
		description: 'Check if app is installed',
		inputSchema: mobileListAppsSchema,
	} as const;

	/**
	 * Handle mobile list apps request.
	 */
	public async handle(request: z.infer<typeof mobileListAppsSchema>): Promise<{ appId: string; installed: Element }> {
		const isInstalled = await this.driver.getConnection().execute(
			'mobile: isAppInstalled',
			{ appId: request.appId }
		);

		return { appId: request.appId, installed: isInstalled };
	}
}
