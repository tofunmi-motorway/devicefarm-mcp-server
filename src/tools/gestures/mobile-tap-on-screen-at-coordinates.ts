import { BaseTool } from '../base-tool';
import { Tool } from '../../enums/tool';
import { z } from 'zod';
import { Platform } from '../../enums/platform';

const mobileTapOnScreenAtCoordinatesSchema = z.object({
	x: z.number(),
	y: z.number(),
	elementId: z.string().optional().describe('The id of the element to click on. This improves accuracy.'),
});

export class MobileTapOnScreenAtCoordinates extends BaseTool<
	Tool.MOBILE_TAP_ON_SCREEN_AT_COORDINATES,
	typeof mobileTapOnScreenAtCoordinatesSchema
> {
	public readonly info = {
		name: Tool.MOBILE_TAP_ON_SCREEN_AT_COORDINATES,
		description: 'Tap at coordinates',
		inputSchema: mobileTapOnScreenAtCoordinatesSchema,
	} as const;

	/**
	 * Handle mobile tap on screen at coordinates request.
	 */
	public async handle(request: z.infer<typeof mobileTapOnScreenAtCoordinatesSchema>): Promise<string> {
		const platform = this.session.platform;
		const method = platform === Platform.ANDROID ? 'clickGesture' : 'tap';

		await (await this.driver.getConnection()).executeScript(`mobile: ${method}`, [{
			x: request.x,
			y: request.y,
			elementId: request.elementId,
		}]);

		return 'Tapped';
	}
}
