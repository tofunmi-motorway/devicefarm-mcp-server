import { BaseTool } from '../base-tool';
import { Tool } from '../../enums/tool';
import { z } from 'zod';

const mobileGetDeviceInfoSchema = z.object({});

export class MobileGetDeviceInfo extends BaseTool<
	Tool.MOBILE_GET_DEVICE_INFO,
	typeof mobileGetDeviceInfoSchema
> {
	public readonly info = {
		name: Tool.MOBILE_GET_DEVICE_INFO,
		description: 'Get device information',
		inputSchema: mobileGetDeviceInfoSchema,
	} as const;

	/**
	 * Handle mobile get device info request.
	 */
	public async handle(): Promise<unknown> {
		return await (await this.driver.getConnection()).executeScript('mobile: deviceInfo', []);
	}
}
