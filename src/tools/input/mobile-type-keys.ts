import { BaseTool } from '../base-tool';
import { Tool } from '../../enums/tool';
import { z } from 'zod';
import { Platform } from '../../enums/platform';

const mobileTypeKeysSchema = z.object({
	text: z.string(),
});

export class MobileTypeKeys extends BaseTool<
	Tool.MOBILE_TYPE_KEYS,
	typeof mobileTypeKeysSchema
> {
	public readonly info = {
		name: Tool.MOBILE_TYPE_KEYS,
		description: 'Type text',
		inputSchema: mobileTypeKeysSchema,
	} as const;

	/**
	 * Handle mobile type keys request.
	 */
	public async handle(request: z.infer<typeof mobileTypeKeysSchema>): Promise<string> {
		switch (this.session.platform) {
			case Platform.ANDROID:
				await this.typeOnAndroid(request);
				break;

			case Platform.IOS:
				await this.typeOnIos(request);
				break;

			default:
				throw new Error('Unsupported platform');
		}

		return 'Text typed';
	}

	/**
	 * Type keys on Android.
	 * @param request
	 * @private
	 */
	private async typeOnAndroid(request: z.infer<typeof mobileTypeKeysSchema>): Promise<void> {
		await (await this.driver.getConnection()).executeScript('mobile: type', [{ text: request.text }]);
	}

	/**
	 * Type keys on iOS.
	 * @param request
	 * @private
	 */
	private async typeOnIos(request: z.infer<typeof mobileTypeKeysSchema>): Promise<void> {
		const connection = await this.driver.getConnection();

		try {
			const activeElementId = await connection.getActiveElement() as unknown;
			const activeElement = await connection.$(activeElementId);

			await activeElement.setValue(request.text);
		} catch (error) {
			console.error('Failed to type on iOS typeOnIos():', error);

			throw new Error(`No active input field found. Tap on an input element before using ${this.info.name}.`);
		}
	}
}
