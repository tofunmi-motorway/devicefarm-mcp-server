import { Request } from './request';
import { Tool } from '../enums/tool';
import { z } from 'zod';

const mobileSwipeOnScreenSchema = z.object({
	direction: z.enum(['up', 'down', 'left', 'right']),
	percent: z.number().optional(),
});

export class MobileSwipeOnScreen extends Request<
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
	 * Uses larger swipe area to avoid accidental clicks.
	 */
	public async handle(request: z.infer<typeof mobileSwipeOnScreenSchema>): Promise<string> {
		const size = await this.driver.getConnection().getWindowSize();
		const percent = request.percent ?? 0.75;

		await this.driver.getConnection().execute('mobile: swipeGesture', {
			left: size.width * 0.1,
			top: size.height * 0.2,
			width: size.width * 0.8,
			height: size.height * 0.6,
			direction: request.direction,
			percent,
		});

		return 'Swiped';
	}
}
