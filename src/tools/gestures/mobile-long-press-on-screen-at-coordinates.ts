import { BaseTool } from '../base-tool';
import { Tool } from '../../enums/tool';
import { z } from 'zod';
import { Platform } from '../../enums/platform';

const mobileLongPressOnScreenAtCoordinatesSchema = z.object({
	x: z.number(),
	y: z.number(),
});

export class MobileLongPressOnScreenAtCoordinates extends BaseTool<
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
		const method = this.session.platform === Platform.ANDROID ? 'longClickGesture' : 'forcePress';

		await (await this.driver.getConnection()).executeScript(`mobile: ${method}`, [{ x: request.x, y: request.y }]);

		return 'Long pressed';
	}
}
