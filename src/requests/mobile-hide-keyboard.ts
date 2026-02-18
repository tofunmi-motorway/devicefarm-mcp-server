import { Request } from './request';
import { Tool } from '../enums/tool';
import { z } from 'zod';

const mobileHideKeyboardSchema = z.object({});

export class MobileHideKeyboard extends Request<
	Tool.MOBILE_HIDE_KEYBOARD,
	typeof mobileHideKeyboardSchema
> {
	public readonly info = {
		name: Tool.MOBILE_HIDE_KEYBOARD,
		description: 'Hide the on-screen keyboard',
		inputSchema: mobileHideKeyboardSchema,
	} as const;

	/**
	 * Handle mobile hide keyboard request.
	 */
	public async handle(): Promise<string> {
		await this.driver.getConnection().hideKeyboard('tapOutside');
		return 'Keyboard hidden';
	}
}
