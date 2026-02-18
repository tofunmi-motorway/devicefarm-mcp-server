import { Request } from './request';
import { Tool } from '../enums/tool';
import { z } from 'zod';

const mobileLaunchAppSchema = z.object({
	appId: z.string(),
});

export class MobileLaunchApp extends Request<
	Tool.MOBILE_LAUNCH_APP,
	typeof mobileLaunchAppSchema
> {
	public readonly info = {
		name: Tool.MOBILE_LAUNCH_APP,
		description: 'Launch app by package ID',
		inputSchema: mobileLaunchAppSchema,
	} as const;

	/**
	 * Handle mobile launch app request. Uses monkey command
	 * to launch app (most reliable method).
	 */
	public async handle(request: z.infer<typeof mobileLaunchAppSchema>): Promise<string> {
		await this.driver.getConnection().execute('mobile: shell', {
			command: 'monkey',
			args: ['-p', request.appId, '-c', 'android.intent.category.LAUNCHER', '1']
		});
		return 'App launched';
	}
}
