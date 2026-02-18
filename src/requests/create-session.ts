import { Request } from './request';
import { Tool } from '../enums/tool';
import { Platform } from '../enums/platform';
import { z } from 'zod';
import { Driver } from '../lib/driver';
import {
	CreateRemoteAccessSessionCommand,
	CreateUploadCommand,
	Device,
	DeviceFarmClient,
	GetRemoteAccessSessionCommand,
	GetUploadCommand,
	InstallToRemoteAccessSessionCommand,
	ListDevicesCommand,
	ListDevicesCommandOutput,
	RemoteAccessSession,
	Upload
} from '@aws-sdk/client-device-farm';
import path from 'node:path';
import fs from 'node:fs';
import { uploadToS3 } from '../lib/s3';
import { Session } from '../lib/session';

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
	apkPath: z.string().optional().describe('Local APK to upload (not auto-installed)'),
	sessionName: z.string().optional(),
	platform: z.enum(Platform).optional(),
	os: z.string().optional(),
	preferredDevices: z.string()
	.array()
	.min(1)
	.optional()
	.describe('Preferred device name (e.g. Samsung, Google)'),
});

export class CreateSession extends Request<
	Tool.CREATE_SESSION,
	typeof createSessionSchema
> {
	public readonly info = {
		name: Tool.CREATE_SESSION,
		description: 'Create Device Farm remote session. Optional apkPath uploads APK to project',
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
		const progressLog: string[] = [];

		let applicationArn: string | undefined = request.appArn;

		if (!applicationArn && request.apkPath) {
			const {arn, progressLog: uploadProgressLog} = await this.uploadAPK(request.apkPath);
			applicationArn = arn;
			progressLog.push(...uploadProgressLog);
		}

		progressLog.push('Creating session...');

		const createCmd = new CreateRemoteAccessSessionCommand({
			projectArn: this.projectARN,
			deviceArn,
			name: request.sessionName || 'MCP Session',
			configuration: {billingMethod: 'METERED'}
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
		await this.driver.connect(readySession.endpoints?.remoteDriverEndpoint as string);

		// start the global session.
		this.session.start(readySession);

		progressLog.push('Session ready!');

		// If appArn exists, automatically install to session
		if (applicationArn) {
			progressLog.push('Installing app to session...');

			const installCmd = new InstallToRemoteAccessSessionCommand({
				remoteAccessSessionArn: readySession.arn as string,
				appArn: applicationArn,
			});

			await this.deviceFarmClient.send(installCmd);

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
				(request.platform && device.platform !== request.platform)
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
	 * Upload an APK and return its ARN.
	 *
	 * @private
	 * @throws
	 */
	private async uploadAPK(apkPath: string): Promise<{
		arn: string;
		progressLog: string[];
	}> {
		const resolvedPath: string = path.isAbsolute(apkPath) ? apkPath : path.resolve(process.cwd(), apkPath);

		if (!fs.existsSync(resolvedPath)) {
			throw new Error(`APK file not found: ${resolvedPath}`);
		}

		const progressLog: string[] = [];

		try {
			progressLog.push(`Uploading ${path.basename(apkPath)}...`);
			const fileName = path.basename(apkPath);
			const createUploadCmd = new CreateUploadCommand({
				projectArn: this.projectARN,
				name: fileName,
				type: 'ANDROID_APP'
			});
			const uploadResponse = await this.deviceFarmClient.send(createUploadCmd);
			const upload = uploadResponse.upload as Upload;

			await uploadToS3(upload.url as string, apkPath);

			progressLog.push('APK uploaded, processing...');

			let uploadStatus = 'INITIALIZED';
			let uploadAttempts = 0;

			while (uploadStatus !== 'SUCCEEDED' && uploadStatus !== 'FAILED' && uploadAttempts < 30) {
				await new Promise(r => setTimeout(r, 2000));

				const getUpCmd = new GetUploadCommand({arn: upload.arn});
				const uploadResult = await this.deviceFarmClient.send(getUpCmd);
				uploadStatus = (uploadResult.upload as Upload).status as string;
				uploadAttempts++;
			}

			if (uploadStatus !== 'SUCCEEDED') {
				throw new Error(`APK processing failed: ${uploadStatus}`);
			}

			progressLog.push('APK ready');

			return {
				arn: upload.arn as string,
				progressLog,
			};
		} catch (uploadError) {
			const errorMessage = (uploadError as Error).message;

			throw new Error(`Failed to upload APK: ${errorMessage}`);
		}
	}

	/**
	 * Wait for the session to be ready.
	 * @private
	 */
	private async waitForSessionReady(sessionArn: string): Promise<RemoteAccessSession> {
		let status = 'PENDING';
		let attempts = 0;
		const maxAttempts = 120; // 10 minutes (120 iterations * 5 seconds each)

		while (!['RUNNING', 'FAILED'].includes(status) && attempts < maxAttempts) {
			await new Promise(r => setTimeout(r, 5000));
			const getCmd = new GetRemoteAccessSessionCommand({arn: sessionArn});
			const sessionResponse = await this.deviceFarmClient.send(getCmd);
			const remoteAccessSession = sessionResponse.remoteAccessSession as RemoteAccessSession;

			status = remoteAccessSession.status as string;

			// If endpoints exist, it means the session is already available
			if (remoteAccessSession.endpoints?.remoteDriverEndpoint) {
				return remoteAccessSession;
			}

			attempts++;
		}

		if (status === 'FAILED') throw new Error('Session failed to start');
		if (attempts >= maxAttempts) throw new Error('Session timeout after 10 minutes');

		// Fetch one last time to ensure we have the latest data
		const getCmd = new GetRemoteAccessSessionCommand({arn: sessionArn});
		const sessionResponse = await this.deviceFarmClient.send(getCmd);

		return sessionResponse.remoteAccessSession as RemoteAccessSession;
	}
}
