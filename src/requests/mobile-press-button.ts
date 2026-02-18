import { Request } from './request';
import { Tool } from '../enums/tool';
import { z } from 'zod';

const mobilePressButtonSchema = z.object({
	button: z.enum(['home', 'back']),
});

export class MobilePressButton extends Request<
	Tool.MOBILE_PRESS_BUTTON,
	typeof mobilePressButtonSchema
> {
	public readonly info = {
		name: Tool.MOBILE_PRESS_BUTTON,
		description: 'Press device button',
		inputSchema: mobilePressButtonSchema,
	} as const;

	/**
	 * Handle mobile press button request.
	 */
	public async handle(request: z.infer<typeof mobilePressButtonSchema>): Promise<string> {
		const keycode = request.button === 'home' ? 3 : 4;

		await this.driver.getConnection().execute('mobile: pressKey', {keycode});

		return `${request.button} button pressed`;
	}
}
