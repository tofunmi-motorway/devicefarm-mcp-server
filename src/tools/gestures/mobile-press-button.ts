import { BaseTool } from '../base-tool';
import { Tool } from '../../enums/tool';
import { z } from 'zod';
import { Platform } from '../../enums/platform';

const mobilePressButtonSchema = z.object({
	button: z.enum(['home', 'back']),
});

export class MobilePressButton extends BaseTool<
	Tool.MOBILE_PRESS_BUTTON,
	typeof mobilePressButtonSchema
> {
	public readonly info = {
		name: Tool.MOBILE_PRESS_BUTTON,
		description: 'Press device button. This is supported only on Android devices.',
		inputSchema: mobilePressButtonSchema,
	} as const;

	/**
	 * Handle mobile press button request.
	 */
	public async handle(request: z.infer<typeof mobilePressButtonSchema>): Promise<string> {
		if (this.session.platform !== Platform.ANDROID) {
			throw new Error('Unsupported platform.');
		}

		const keycode = request.button === 'home' ? 3 : 4;

		await (await this.driver.getConnection()).execute('mobile: pressKey', {keycode});

		return `${request.button} button pressed`;
	}
}
