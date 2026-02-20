import { Platform } from '../enums/platform';
import {
	CreateUploadCommand,
	DeviceFarmClient,
	GetUploadCommand,
	InstallToRemoteAccessSessionCommand,
	Upload,
	UploadType
} from '@aws-sdk/client-device-farm';
import path from 'node:path';
import fs from 'node:fs';
import { uploadToS3 } from './s3';
import { Session } from './session';
import { waitFor } from './wait-for';
import { Driver } from './driver';

/**
 * Upload an application file and install the application on a device within a session.
 */
export async function uploadAndInstallApplication({
	applicationPath,
	applicationId,
	driver,
	session,
	deviceFarmClient,
	projectARN,
}: {
	applicationPath: string,
	applicationId?: string,
	driver: Driver,
	session: Session;
	deviceFarmClient: DeviceFarmClient;
	projectARN: string;
}) {
	const {arn: uploadARN, progressLog: uploadProgressLog} = await uploadApplication(applicationPath, {
		platform: session.platform,
		deviceFarmClient,
		projectARN,
	});

	await installApplication({
		applicationARN: uploadARN,
		applicationId,
		driver,
		session,
		deviceFarmClient,
	});

	return {
		uploadARN,
		progressLog: [
			...uploadProgressLog,
			'App installed!',
		],
	}
}

/**
 * Upload an application to device-farm.
 */
export async function uploadApplication(applicationPath: string, {
	platform,
	deviceFarmClient,
	projectARN,
}: {
	deviceFarmClient: DeviceFarmClient;
	platform: Platform;
	projectARN: string;
}): Promise<{
	arn: string;
	progressLog: string[];
}> {
	const platformToUploadType: Record<Platform, UploadType> = {
		[Platform.ANDROID]: 'ANDROID_APP',
		[Platform.IOS]: 'IOS_APP',
	};
	const resolvedPath = path.isAbsolute(applicationPath)
		? applicationPath
		: path.resolve(process.cwd(), applicationPath);

	if (!fs.existsSync(resolvedPath)) throw new Error(`Application file not found: ${resolvedPath}`);

	const progressLog: string[] = [
		`Uploading ${path.basename(resolvedPath)}...`,
	];

	try {
		const fileName = path.basename(resolvedPath);
		const createUpCmd = new CreateUploadCommand({
			projectArn: projectARN,
			name: fileName,
			type: platformToUploadType[platform],
		});
		const uploadResponse = await deviceFarmClient.send(createUpCmd);
		const upload = uploadResponse.upload as Upload;

		await uploadToS3(upload.url as string, resolvedPath);

		progressLog.push('Application file uploaded, processing...');

		const SUCCEEDED = 'SUCCEEDED';

		// wait for upload success/failure status
		const {status: uploadStatus} = await waitFor<undefined>(async () => {
			const getCmd = new GetUploadCommand({arn: upload.arn});
			const getUploadResponse = await deviceFarmClient.send(getCmd);

			return {
				status: getUploadResponse?.upload?.status as string,
			};
		}, {
			acceptableStatuses: [SUCCEEDED, 'FAILED'],
			maxAttempts: 30,
			intervalMs: 2000,
			timeoutMessage: 'Checking upload status operation timed out.',
		});

		if (uploadStatus !== SUCCEEDED) throw new Error('Upload failed');

		progressLog.push('Application file ready');

		return {
			arn: upload.arn as string,
			progressLog: progressLog,
		}
	} catch (uploadError) {
		const errorMessage = (uploadError as Error).message;

		throw new Error(`Failed to upload application file: ${errorMessage}`);
	}
}

/**
 * Install an application on a device.
 */
export async function installApplication({
	applicationARN,
	applicationId,
	driver,
	session,
	deviceFarmClient,
}: {
	applicationARN: string;
	applicationId?: string;
	driver: Driver;
	session: Session;
	deviceFarmClient: DeviceFarmClient;
}): Promise<void> {
	const installCmd = new InstallToRemoteAccessSessionCommand({
		remoteAccessSessionArn: session.current.arn as string,
		appArn: applicationARN
	});

	await deviceFarmClient.send(installCmd);

	// If application-id is provided, poll for it to be installed.
	if (applicationId) {
		const INSTALLED = 'INSTALLED';

		// If timeout happens, means either the application was not installed
		// or installation took too long.
		await waitFor(async () => {
			const isInstalled = await isApplicationInstalled({
				platform: session.platform,
				applicationId,
				driver,
			});

			return {
				status: isInstalled ? INSTALLED : 'NOT_INSTALLED',
			}
		}, {
			acceptableStatuses: [INSTALLED],
			timeoutMessage: 'Waiting for application to be ready on device timed out.',
			intervalMs: 2000,
			maxAttempts: 30, // 1 minute (30 attempts - 1 every 2 seconds)
		});
	}
}

/**
 * Check if an app is installed on a device.
 */
export async function isApplicationInstalled({
	platform,
	applicationId,
	driver,
}: {
	platform: Platform;
	applicationId: string;
	driver: Driver;
}): Promise<boolean> {
	const keyName = platform === Platform.IOS ? 'bundleId' : 'appId';

	return await (await driver.getConnection()).executeScript(
		'mobile: isAppInstalled',
		[{ [keyName]: applicationId }]
	);
}
