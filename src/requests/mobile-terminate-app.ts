import { Request } from './request';
import { Tool } from '../enums/tool';
import { z } from 'zod';

const mobileTerminateAppSchema = z.object({
	appId: z.string(),
});

export class MobileTerminateApp extends Request<
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
		await this.driver.getConnection().execute('mobile: terminateApp', { appId: request.appId });
		return 'App terminated';
	}
}
