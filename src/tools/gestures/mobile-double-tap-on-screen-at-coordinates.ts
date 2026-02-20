import { BaseTool } from '../base-tool';
import { Tool } from '../../enums/tool';
import { z } from 'zod';
import { Platform } from '../../enums/platform';

const mobileDoubleTapOnScreenSchema = z.object({
	x: z.number(),
	y: z.number(),
});

export class MobileDoubleTapOnScreenAtCoordinates extends BaseTool<
	Tool.MOBILE_DOUBLE_TAP_ON_SCREEN_AT_COORDINATES,
	typeof mobileDoubleTapOnScreenSchema
> {
	public readonly info = {
		name: Tool.MOBILE_DOUBLE_TAP_ON_SCREEN_AT_COORDINATES,
		description: 'Double tap at coordinates',
		inputSchema: mobileDoubleTapOnScreenSchema,
	} as const;

	/**
	 * Handle mobile double tap on screen request.
	 */
	public async handle(request: z.infer<typeof mobileDoubleTapOnScreenSchema>): Promise<string> {
		const method = this.session.platform === Platform.ANDROID ? 'doubleClickGesture' : 'doubleTap';

		await (await this.driver.getConnection()).executeScript(`mobile: ${method}`, [{ x: request.x, y: request.y }]);

		return 'Double tapped';
	}
}
