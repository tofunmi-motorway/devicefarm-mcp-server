import { Request } from './request';
import { Tool } from '../enums/tool';
import { z } from 'zod';

const mobileLongPressOnScreenAtCoordinatesSchema = z.object({
	x: z.number(),
	y: z.number(),
});

export class MobileLongPressOnScreenAtCoordinates extends Request<
	Tool.MOBILE_LONG_PRESS_ON_SCREEN_AT_COORDINATES,
	typeof mobileLongPressOnScreenAtCoordinatesSchema
> {
	public readonly info = {
		name: Tool.MOBILE_LONG_PRESS_ON_SCREEN_AT_COORDINATES,
		description: 'Long press at coordinates',
		inputSchema: mobileLongPressOnScreenAtCoordinatesSchema,
	} as const;

	/**
	 * Handle mobile long press on screen at coordinates request.
	 */
	public async handle(request: z.infer<typeof mobileLongPressOnScreenAtCoordinatesSchema>): Promise<string> {
		await this.driver.getConnection().execute('mobile: longClickGesture', { x: request.x, y: request.y });
		return 'Long pressed';
	}
}
