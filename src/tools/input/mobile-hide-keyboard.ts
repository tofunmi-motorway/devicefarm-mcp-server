import { BaseTool } from '../base-tool';
import { Tool } from '../../enums/tool';
import { z } from 'zod';
import { Platform } from '../../enums/platform';

const mobileHideKeyboardSchema = z.object({});

export class MobileHideKeyboard extends BaseTool<
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
		switch (this.session.platform) {
			case Platform.ANDROID:
				await this.hideAndroidKeyboard();
				break;

			case Platform.IOS:
				await this.hideIosKeyboard();
				break;

			default:
				throw new Error('Unsupported platform');
		}

		return 'Keyboard hidden';
	}

	/**
	 * Hide keyboard on android device.
	 *
	 * @private
	 */
	private async hideAndroidKeyboard(): Promise<void> {
		await (await this.driver.getConnection()).hideKeyboard('tapOutside');
	}

	/**
	 * Hide keyboard on IOS device.
	 *
	 * @private
	 */
	private async hideIosKeyboard(): Promise<void> {
		await (await this.driver.getConnection()).executeScript('mobile: hideKeyboard', []);
	}
}
