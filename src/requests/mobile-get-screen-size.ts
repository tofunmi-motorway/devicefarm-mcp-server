import { Request } from './request';
import { Tool } from '../enums/tool';
import { z } from 'zod';

const mobileGetScreenSizeSchema = z.object({});

export class MobileGetScreenSize extends Request<
	Tool.MOBILE_GET_SCREEN_SIZE,
	typeof mobileGetScreenSizeSchema
> {
	public readonly info = {
		name: Tool.MOBILE_GET_SCREEN_SIZE,
		description: 'Get device screen size',
		inputSchema: mobileGetScreenSizeSchema,
	} as const;

	/**
	 * Handle mobile get screen size request.
	 */
	public async handle(): Promise<{ width: number; height: number }> {
		return await this.driver.getConnection().getWindowSize();
	}
}
