import { Request } from './request';
import { Tool } from '../enums/tool';
import { z } from 'zod';

const mobileUninstallAppSchema = z.object({
	appId: z.string(),
});

export class MobileUninstallApp extends Request<
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
		await this.driver.getConnection().execute('mobile: removeApp', { appId: request.appId });

		return 'App uninstalled';
	}
}
