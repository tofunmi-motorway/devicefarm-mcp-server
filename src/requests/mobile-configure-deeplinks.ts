import { Request } from './request';
import { Tool } from '../enums/tool';
import { z } from 'zod';

const mobileConfigureDeeplinksSchema = z.object({
	appId: z.string().describe('App package ID'),
});

export class MobileConfigureDeeplinks extends Request<
	Tool.MOBILE_CONFIGURE_DEEPLINKS,
	typeof mobileConfigureDeeplinksSchema
> {
	public readonly info = {
		name: Tool.MOBILE_CONFIGURE_DEEPLINKS,
		description: 'Configure app to handle deep links automatically',
		inputSchema: mobileConfigureDeeplinksSchema,
	} as const;

	/**
	 * Handle mobile configure deeplinks request.
	 */
	public async handle(request: z.infer<typeof mobileConfigureDeeplinksSchema>): Promise<string> {
		// Approve all declared deep link domains for the app
		await this.driver.getConnection().execute('mobile: shell', {
			command: 'pm',
			args: ['set-app-links-user-selection', '--user', '0', '--package', request.appId, 'true', 'all']
		});

		return 'Deep links configured';
	}
}
