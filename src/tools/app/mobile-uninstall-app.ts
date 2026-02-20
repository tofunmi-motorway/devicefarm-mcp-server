import { BaseTool } from '../base-tool';
import { Tool } from '../../enums/tool';
import { z } from 'zod';
import { Platform } from '../../enums/platform';

const mobileUninstallAppSchema = z.object({
	appId: z.string(),
});

export class MobileUninstallApp extends BaseTool<
	Tool.MOBILE_UNINSTALL_APP,
	typeof mobileUninstallAppSchema
> {
	public readonly info = {
		name: Tool.MOBILE_UNINSTALL_APP,
		description: 'Uninstall app',
		inputSchema: mobileUninstallAppSchema,
	} as const;

	/**
	 * Handle mobile uninstall app request.
	 */
	public async handle(request: z.infer<typeof mobileUninstallAppSchema>): Promise<string> {
		const keyName = this.session.platform === Platform.ANDROID ? 'appId' : 'bundleId';

		await (await this.driver.getConnection()).executeScript('mobile: removeApp', [{ [keyName]: request.appId }]);

		return 'App uninstalled';
	}
}
