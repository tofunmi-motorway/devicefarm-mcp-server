import { Request } from './request';
import { Tool } from '../enums/tool';
import { z } from 'zod';

const mobileSwitchToNativeSchema = z.object({});

export class MobileSwitchToNative extends Request<
	Tool.MOBILE_SWITCH_TO_NATIVE,
	typeof mobileSwitchToNativeSchema
> {
	public readonly info = {
		name: Tool.MOBILE_SWITCH_TO_NATIVE,
		description: 'Switch back to native app context',
		inputSchema: mobileSwitchToNativeSchema,
	} as const;

	/**
	 * Handle mobile switch to native request.
	 */
	public async handle(): Promise<string> {
		await this.driver.getConnection().switchContext('NATIVE_APP');

		return 'Switched to native context';
	}
}
