import { Request } from './request';
import { Tool } from '../enums/tool';
import { z } from 'zod';
import fs from 'node:fs';

const mobileSaveScreenshotSchema = z.object({
	path: z.string(),
});

export class MobileSaveScreenshot extends Request<
	Tool.MOBILE_SAVE_SCREENSHOT,
	typeof mobileSaveScreenshotSchema
> {
	public readonly info = {
		name: Tool.MOBILE_SAVE_SCREENSHOT,
		description: 'Save screenshot to file',
		inputSchema: mobileSaveScreenshotSchema,
	} as const;

	/**
	 * Handle mobile save screenshot request.
	 */
	public async handle(request: z.infer<typeof mobileSaveScreenshotSchema>): Promise<string> {
		const screenshot = await this.driver.getConnection().takeScreenshot();

		fs.writeFileSync(request.path, screenshot, 'base64');

		return `Screenshot saved to ${request.path}`;
	}
}
