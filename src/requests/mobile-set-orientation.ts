import { Request } from './request';
import { Tool } from '../enums/tool';
import { z } from 'zod';

const mobileSetOrientationSchema = z.object({
	orientation: z.enum(['PORTRAIT', 'LANDSCAPE']),
});

export class MobileSetOrientation extends Request<
	Tool.MOBILE_SET_ORIENTATION,
	typeof mobileSetOrientationSchema
> {
	public readonly info = {
		name: Tool.MOBILE_SET_ORIENTATION,
		description: 'Set screen orientation',
		inputSchema: mobileSetOrientationSchema,
	} as const;

	/**
	 * Handle mobile set orientation request.
	 */
	public async handle(request: z.infer<typeof mobileSetOrientationSchema>): Promise<string> {
		await this.driver.getConnection().setOrientation(request.orientation);
		return 'Orientation set';
	}
}
