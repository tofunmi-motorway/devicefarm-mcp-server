import { Request } from './request';
import { Tool } from '../enums/tool';
import { z } from 'zod';

const mobileDoubleTapOnScreenSchema = z.object({
	x: z.number(),
	y: z.number(),
});

export class MobileDoubleTapOnScreen extends Request<
	Tool.MOBILE_DOUBLE_TAP_ON_SCREEN,
	typeof mobileDoubleTapOnScreenSchema
> {
	public readonly info = {
		name: Tool.MOBILE_DOUBLE_TAP_ON_SCREEN,
		description: 'Double tap at coordinates',
		inputSchema: mobileDoubleTapOnScreenSchema,
	} as const;

	/**
	 * Handle mobile double tap on screen request.
	 */
	public async handle(request: z.infer<typeof mobileDoubleTapOnScreenSchema>): Promise<string> {
		await this.driver.getConnection().execute('mobile: doubleClickGesture', { x: request.x, y: request.y });
		return 'Double tapped';
	}
}
