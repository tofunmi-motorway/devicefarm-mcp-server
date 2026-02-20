import { BaseTool } from '../base-tool';
import { Tool } from '../../enums/tool';
import { Platform } from '../../enums/platform';
import { z } from 'zod';
import { Driver } from '../../lib/driver';
import {
	CreateRemoteAccessSessionCommand,
	Device,
	DeviceFarmClient,
	GetRemoteAccessSessionCommand,
	ListDevicesCommand,
	ListDevicesCommandOutput,
	RemoteAccessSession,
} from '@aws-sdk/client-device-farm';
import { Session } from '../../lib/session';
import { installApplication, uploadApplication } from '../../lib/application';
import { waitFor } from '../../lib/wait-for';

type Response = {
	sessionArn: string;
	appiumEndpoint?: string;
	interactiveEndpoint?: string;
	status: string;
	device?: string;
	uploadedAppArn?: string;
	appInstalled: boolean;
	progress: string[];
};

const createSessionSchema = z.object({
	deviceArn: z.string().optional(),
	appArn: z.string().optional().describe('Pre-uploaded app ARN'),
	applicationPath: z.string().optional()
	.describe('Local application to upload (APK file for android and IPA for iOS)'),
	applicationId: z.string().optional().describe('The application ID of the application if known.'),
	sessionName: z.string().optional(),
	platform: z.enum(Platform).describe('Required: ANDROID | IOS'),
	os: z.string().optional(),
	preferredDevices: z.string()
	.array()
	.min(1)
	.optional()
	.describe('Preferred device name (e.g. Samsung, Google)'),
});

export class CreateSession extends BaseTool<
	Tool.CREATE_SESSION,
	typeof createSessionSchema
> {
	public readonly info = {
		name: Tool.CREATE_SESSION,
		description: 'Create Device Farm remote session. Optional applicationPath uploads application file to project',
		inputSchema: createSessionSchema,
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
	 * Handle create-session request.
	 */
	public async handle(request: z.infer<typeof createSessionSchema>): Promise<Response> {
		const deviceArn: string = await this.resolveDeviceArn(request);
		const { arn: applicationArn, progressLog: resolveApplicationProgress } = (await this.resolveApplicationArn(request)) ?? {};

		const progressLog: string[] = [
			...(resolveApplicationProgress ?? []),
			'Creating session...',
		];

		const createCmd = new CreateRemoteAccessSessionCommand({
			projectArn: this.projectARN,
			deviceArn,
			name: request.sessionName || 'MCP Session',
			configuration: { billingMethod: 'METERED' }
		});

		const sessionResponse = await this.deviceFarmClient.send(createCmd);
		const remoteAccessSession = sessionResponse.remoteAccessSession as RemoteAccessSession;

		progressLog.push(
			`Session created: ${remoteAccessSession.status}`,
			'Waiting for Appium endpoint...',
		);

		const readySession: RemoteAccessSession = await this.waitForSessionReady(remoteAccessSession.arn as string);

		const driverUrl = readySession.endpoints?.remoteDriverEndpoint;

		if (!driverUrl) {
			throw new Error('No Appium endpoint available');
		}

		// connect global driver.
		await this.driver.connect(
			readySession.endpoints?.remoteDriverEndpoint as string,
			request.platform,
		);

		// start the global session.
		this.session.start(readySession);

		progressLog.push('Session ready!');

		// If application ARN exists, automatically install to session
		if (applicationArn) {
			progressLog.push('Installing app to session...');

			await installApplication({
				applicationARN: applicationArn,
				applicationId: request.applicationId,
				driver: this.driver,
				session: this.session,
				deviceFarmClient: this.deviceFarmClient,
			});

			progressLog.push('App installed!');
		}

		return {
			sessionArn: readySession.arn as string,
			appiumEndpoint: readySession.endpoints?.remoteDriverEndpoint,
			interactiveEndpoint: readySession.endpoints?.interactiveEndpoint,
			status: readySession.status as string,
			device: readySession.device?.name,
			uploadedAppArn: applicationArn,
			appInstalled: !!applicationArn,
			progress: progressLog
		};
	}

	/**
	 * Resolve the device ARN either from the request (if available) or by requesting from AWS.
	 *
	 * @param request
	 * @private
	 */
	private async resolveDeviceArn(request: z.infer<typeof createSessionSchema>): Promise<string> {
		if (request.deviceArn) {
			return request.deviceArn;
		}

		const listCmd = new ListDevicesCommand({arn: this.projectARN});
		const devices: ListDevicesCommandOutput = await this.deviceFarmClient.send(listCmd);

		const deviceGroups: {
			available: Device[],
			highlyAvailable: Device[],
			others: Device[],
		} = {
			available: [],
			highlyAvailable: [],
			others: [],
		};

		/**
		 * Check if provided device name matches the user's preference.
		 * @param deviceName
		 */
		const deviceNameMatchesPreferences = (deviceName?: string): boolean => {
			if (!deviceName || !request.preferredDevices) {
				return false;
			}

			return request.preferredDevices?.some((name) => deviceName.toLowerCase().includes(name.toLowerCase()))
		}

		// Group devices into available, highly available and others.
		devices?.devices?.forEach((device) => {
			if (
				// If a specific platform is requested and this device is not in that platform, skip it.
				(device.platform !== request.platform)
				// If a specific os is requested and this device is not on the os, skip it.
				// Intentionally not doing a strict equality here (!==) because the
				// requester might send an actual number (e.g. 11 instead of "11").
				|| (request.os && device.os != request.os)
				// If a specific device name is requested and this device is of a different name, skip it.
				|| (request.preferredDevices && !deviceNameMatchesPreferences(device.name))
			) {
				return;
			}

			switch (device.availability) {
				case 'AVAILABLE':
					deviceGroups.available.push(device);
					break;
				case 'HIGHLY_AVAILABLE':
					deviceGroups.highlyAvailable.push(device);
					break;
				default:
					deviceGroups.others.push(device);
			}
		});

		// prefer AVAILABlE over HIGHLY_AVAILABLE over others.
		const preferredDevice: Device | undefined = deviceGroups.available[0]
			?? deviceGroups.highlyAvailable[0]
			?? deviceGroups.others[0];

		if (!preferredDevice) {
			throw new Error('No devices found')
		}

		return preferredDevice.arn as string;
	}

	/**
	 * Resolve the application ARN if needed. Else, return undefined.
	 *
	 * @param request
	 * @private
	 */
	private async resolveApplicationArn(request: z.infer<typeof createSessionSchema>): Promise<{
		arn: string;
		progressLog: string[];
	} | undefined> {
		if (request.appArn) {
			return {
				arn: request.appArn,
				progressLog: [],
			};
		}

		// If no app arn was provided and a path wasn't also given, return undefined.
		if (!request.applicationPath) {
			return;
		}

		// Upload the application file.
		const {arn, progressLog} = await uploadApplication(request.applicationPath, {
				platform: request.platform,
				deviceFarmClient: this.deviceFarmClient,
				projectARN: this.projectARN,
		});

		return {
			arn,
			progressLog,
		};
	}

	/**
	 * Wait for the session to be ready.
	 * @private
	 */
	private async waitForSessionReady(sessionArn: string): Promise<RemoteAccessSession> {
		const RUNNING = 'RUNNING';
		const FAILED = 'FAILED';

		// wait for running/failed status for remote session.
		const { status, data: latestSession } = await waitFor<RemoteAccessSession>(async () => {
			const getCmd = new GetRemoteAccessSessionCommand({arn: sessionArn});
			const sessionResponse = await this.deviceFarmClient.send(getCmd);
			const remoteAccessSession = sessionResponse.remoteAccessSession as RemoteAccessSession;

			return {
				// If endpoints exist, it means the session is already available
				status: remoteAccessSession.endpoints?.remoteDriverEndpoint
					? RUNNING
					: remoteAccessSession.status as string,
				data: remoteAccessSession,
			};
		}, {
			acceptableStatuses: [RUNNING, FAILED],
			intervalMs: 5000,
			maxAttempts: 120, // 10 minutes (120 iterations * 5 seconds each)
			timeoutMessage: 'Session timeout after 10 minutes',
		});

		if (status === FAILED) throw new Error('Session failed to start');

		return latestSession;
	}
}
