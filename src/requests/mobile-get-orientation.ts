import { Request } from './request';
import { Tool } from '../enums/tool';
import { z } from 'zod';

const mobileGetOrientationSchema = z.object({});

export class MobileGetOrientation extends Request<
	Tool.MOBILE_GET_ORIENTATION,
	typeof mobileGetOrientationSchema
> {
	public readonly info = {
		name: Tool.MOBILE_GET_ORIENTATION,
		description: 'Get screen orientation',
		inputSchema: mobileGetOrientationSchema,
	} as const;

	/**
	 * Handle mobile get orientation request.
	 */
	public async handle(): Promise<string> {
		return await this.driver.getConnection().getOrientation();
	}
}
