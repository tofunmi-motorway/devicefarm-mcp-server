import { BaseTool } from '../base-tool';
import { Tool } from '../../enums/tool';
import { z } from 'zod';
import { Platform } from '../../enums/platform';

const mobileLaunchAppSchema = z.object({
	appId: z.string(),
});

export class MobileLaunchApp extends BaseTool<
	Tool.MOBILE_LAUNCH_APP,
	typeof mobileLaunchAppSchema
> {
	public readonly info = {
		name: Tool.MOBILE_LAUNCH_APP,
		description: 'Launch app by package ID',
		inputSchema: mobileLaunchAppSchema,
	} as const;

	/**
	 * Handle mobile launch app request.
	 */
	public async handle(request: z.infer<typeof mobileLaunchAppSchema>): Promise<string> {
		const platform = this.session.platform;

		switch (platform) {
			case Platform.ANDROID:
				await this.launchAndroidApplication(request);
				break;

			case Platform.IOS:
				await this.launchIosApplication(request);
				break;

			default:
				throw new Error(`Unsupported platform: ${platform}`);
		}

		return 'App launched';
	}

	/**
	 * Launch an Android application. Uses monkey command
	 * to launch app (most reliable method).
	 *
	 * @param request
	 * @private
	 */
	private async launchAndroidApplication(request: z.infer<typeof mobileLaunchAppSchema>): Promise<void> {
		await (await this.driver.getConnection()).execute('mobile: shell', {
			command: 'monkey',
			args: ['-p', request.appId, '-c', 'android.intent.category.LAUNCHER', '1']
		});
	}

	/**
	 * Launch an iOS application.
	 *
	 * @param request
	 * @private
	 */
	private async launchIosApplication(request: z.infer<typeof mobileLaunchAppSchema>): Promise<void> {
		await (await this.driver.getConnection()).executeScript('mobile: launchApp', [{ bundleId: request.appId }]);
	}
}
