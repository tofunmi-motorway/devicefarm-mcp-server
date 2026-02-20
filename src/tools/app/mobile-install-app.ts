import { BaseTool } from '../base-tool';
import { Tool } from '../../enums/tool';
import { z } from 'zod';
import { DeviceFarmClient } from '@aws-sdk/client-device-farm';
import { Driver } from '../../lib/driver';
import { Session } from '../../lib/session';
import { uploadAndInstallApplication } from '../../lib/application';

const mobileInstallAppSchema = z.object({
	applicationPath: z.string(),
	applicationId: z.string().optional().describe('The application id of the application if known.'),
});

export class MobileInstallApp extends BaseTool<
	Tool.MOBILE_INSTALL_APP,
	typeof mobileInstallAppSchema
> {
	public readonly info = {
		name: Tool.MOBILE_INSTALL_APP,
		description: 'Install application (APK for Android or IPA for iOS) via AWS Device Farm',
		inputSchema: mobileInstallAppSchema,
	} as const;

	constructor(
		driver: Driver,
		session: Session,
		private readonly deviceFarmClient: DeviceFarmClient,
		private readonly projectARN: string,
	) {
		super(driver, session);
	}

	/**
	 * Handle mobile install app request.
	 */
	public async handle(request: z.infer<typeof mobileInstallAppSchema>): Promise<string> {
		const { uploadARN } = await uploadAndInstallApplication({
			applicationPath: request.applicationPath,
			applicationId: request.applicationId,
			driver: this.driver,
			session: this.session,
			deviceFarmClient: this.deviceFarmClient,
			projectARN: this.projectARN,
		});

		return `Application installed successfully. ARN: ${uploadARN}`;
	}
}
