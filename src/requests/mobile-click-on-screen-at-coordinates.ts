import { Request } from './request';
import { Tool } from '../enums/tool';
import { z } from 'zod';

const mobileClickOnScreenAtCoordinatesSchema = z.object({
	x: z.number(),
	y: z.number(),
});

export class MobileClickOnScreenAtCoordinates extends Request<
	Tool.MOBILE_CLICK_ON_SCREEN_AT_COORDINATES,
	typeof mobileClickOnScreenAtCoordinatesSchema
> {
	public readonly info = {
		name: Tool.MOBILE_CLICK_ON_SCREEN_AT_COORDINATES,
		description: 'Click at coordinates',
		inputSchema: mobileClickOnScreenAtCoordinatesSchema,
	} as const;

	/**
	 * Handle mobile click on screen at coordinates request.
	 */
	public async handle(request: z.infer<typeof mobileClickOnScreenAtCoordinatesSchema>): Promise<string> {
		await this.driver.getConnection().execute('mobile: clickGesture', { x: request.x, y: request.y });
		return 'Clicked';
	}
}
