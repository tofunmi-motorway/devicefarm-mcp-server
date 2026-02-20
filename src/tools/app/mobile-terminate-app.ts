import { BaseTool } from '../base-tool';
import { Tool } from '../../enums/tool';
import { z } from 'zod';
import { Platform } from '../../enums/platform';

const mobileTerminateAppSchema = z.object({
	appId: z.string(),
});

export class MobileTerminateApp extends BaseTool<
	Tool.MOBILE_TERMINATE_APP,
	typeof mobileTerminateAppSchema
> {
	public readonly info = {
		name: Tool.MOBILE_TERMINATE_APP,
		description: 'Terminate app',
		inputSchema: mobileTerminateAppSchema,
	} as const;

	/**
	 * Handle mobile terminate app request.
	 */
	public async handle(request: z.infer<typeof mobileTerminateAppSchema>): Promise<string> {
		const keyName = this.session.platform === Platform.IOS ? 'bundleId' : 'appId';

		await (await this.driver.getConnection()).executeScript('mobile: terminateApp', [{ [keyName]: request.appId }]);

		return 'App terminated';
	}
}
