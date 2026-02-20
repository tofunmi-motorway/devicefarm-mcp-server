import { BaseTool } from '../base-tool';
import { Tool } from '../../enums/tool';
import { z } from 'zod';
import { Platform } from '../../enums/platform';

const mobileConfigureDeeplinksSchema = z.object({
	appId: z.string().describe('App package ID'),
});

export class MobileConfigureDeeplinks extends BaseTool<
	Tool.MOBILE_CONFIGURE_DEEPLINKS,
	typeof mobileConfigureDeeplinksSchema
> {
	public readonly info = {
		name: Tool.MOBILE_CONFIGURE_DEEPLINKS,
		description: 'Configure app to handle deep links automatically. This is supported only on Android devices.',
		inputSchema: mobileConfigureDeeplinksSchema,
	} as const;

	/**
	 * Handle mobile configure deeplinks request.
	 */
	public async handle(request: z.infer<typeof mobileConfigureDeeplinksSchema>): Promise<string> {
		if (this.session.platform !== Platform.ANDROID) {
			throw new Error('Unsupported platform.');
		}

		// Approve all declared deep link domains for the app
		await (await this.driver.getConnection()).execute('mobile: shell', {
			command: 'pm',
			args: ['set-app-links-user-selection', '--user', '0', '--package', request.appId, 'true', 'all']
		});

		return 'Deep links configured';
	}
}
