import { Request } from './request';
import { Tool } from '../enums/tool';
import { z } from 'zod';

const mobileTypeKeysSchema = z.object({
	text: z.string(),
});

export class MobileTypeKeys extends Request<
	Tool.MOBILE_TYPE_KEYS,
	typeof mobileTypeKeysSchema
> {
	public readonly info = {
		name: Tool.MOBILE_TYPE_KEYS,
		description: 'Type text',
		inputSchema: mobileTypeKeysSchema,
	} as const;

	/**
	 * Handle mobile type keys request.
	 */
	public async handle(request: z.infer<typeof mobileTypeKeysSchema>): Promise<string> {
		await this.driver.getConnection().execute('mobile: type', { text: request.text });

		return 'Text typed';
	}
}
