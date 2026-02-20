import { BaseTool } from '../base-tool';
import { Tool } from '../../enums/tool';
import { z } from 'zod';
import { isApplicationInstalled } from '../../lib/application';

const mobileListAppsSchema = z.object({
	appId: z.string(),
});

export class MobileCheckAppIsInstalled extends BaseTool<
	Tool.MOBILE_CHECK_APP_IS_INSTALLED,
	typeof mobileListAppsSchema
> {
	public readonly info = {
		name: Tool.MOBILE_CHECK_APP_IS_INSTALLED,
		description: 'Check if an app is installed',
		inputSchema: mobileListAppsSchema,
	} as const;

	/**
	 * Handle mobile list apps request.
	 */
	public async handle(request: z.infer<typeof mobileListAppsSchema>): Promise<{
		appId: string;
		installed: boolean;
	}> {
		const isInstalled = await isApplicationInstalled({
			platform: this.session.platform,
			applicationId: request.appId,
			driver: this.driver,
		});

		return { appId: request.appId, installed: isInstalled };
	}
}
