import { BaseTool } from '../base-tool';
import { Tool } from '../../enums/tool';
import { z } from 'zod';

const mobileListElementsOnScreenSchema = z.object({});

export class MobileListElementsOnScreen extends BaseTool<
	Tool.MOBILE_LIST_ELEMENTS_ON_SCREEN,
	typeof mobileListElementsOnScreenSchema
> {
	public readonly info = {
		name: Tool.MOBILE_LIST_ELEMENTS_ON_SCREEN,
		description: 'List all elements on screen',
		inputSchema: mobileListElementsOnScreenSchema,
	} as const;

	/**
	 * Handle mobile list elements on screen request.
	 */
	public async handle(): Promise<string> {
		return await (await this.driver.getConnection()).getPageSource();
	}
}
