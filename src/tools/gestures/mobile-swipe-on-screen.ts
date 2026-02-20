import { BaseTool } from '../base-tool';
import { Tool } from '../../enums/tool';
import { z } from 'zod';
import { Platform } from '../../enums/platform';

const mobileSwipeOnScreenSchema = z.object({
	direction: z.enum(['up', 'down', 'left', 'right']),
	percent: z.number().optional().describe('Only provide this for Android'),
	velocity: z.number().optional()
		.describe('The value is measured in pixels per second and same values could behave differently on different devices depending on their display density. Higher values make swipe gesture faster (which usually scrolls larger areas if we apply it to a list) and lower values slow it down. Only values greater than zero have effect.'),
});

export class MobileSwipeOnScreen extends BaseTool<
	Tool.MOBILE_SWIPE_ON_SCREEN,
	typeof mobileSwipeOnScreenSchema
> {
	public readonly info = {
		name: Tool.MOBILE_SWIPE_ON_SCREEN,
		description: 'Swipe gesture',
		inputSchema: mobileSwipeOnScreenSchema,
	} as const;

	/**
	 * Handle mobile swipe on screen request.
	 */
	public async handle(request: z.infer<typeof mobileSwipeOnScreenSchema>): Promise<string> {
		switch (this.session.platform) {
			case Platform.ANDROID:
				await this.swipeOnAndroid(request);
				break;

			case Platform.IOS:
				await this.swipeOnIos(request);
				break;

			default:
				throw new Error('Unsupported platform');
		}

		return 'Swiped';
	}

	/**
	 * Android uses manual swipes.
	 * @private
	 */
	private async swipeOnAndroid(request: z.infer<typeof mobileSwipeOnScreenSchema>): Promise<void> {
		const connection = await this.driver.getConnection();
		const size = await connection.getWindowSize();
		const percent = request.percent ?? 0.75;

		await connection.execute('mobile: swipeGesture', {
			left: size.width * 0.1,
			top: size.height * 0.2,
			width: size.width * 0.8,
			height: size.height * 0.6,
			direction: request.direction,
			percent,
		});
	}

	/**
	 * Swipe on iOS.
	 * @param request
	 * @private
	 */
	private async swipeOnIos(request: z.infer<typeof mobileSwipeOnScreenSchema>): Promise<void> {
		await (await this.driver.getConnection()).executeScript('mobile: swipe', [{
			direction: request.direction,
			velocity: request.velocity,
		}]);
	}
}
