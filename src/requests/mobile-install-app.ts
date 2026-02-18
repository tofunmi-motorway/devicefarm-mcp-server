import { Request } from './request';
import { Tool } from '../enums/tool';
import { z } from 'zod';
import { DeviceFarmClient, CreateUploadCommand, GetUploadCommand, InstallToRemoteAccessSessionCommand } from '@aws-sdk/client-device-farm';
import path from 'node:path';
import fs from 'node:fs';
import { uploadToS3 } from '../lib/s3';
import { Driver } from '../lib/driver';
import { Session } from '../lib/session';

const mobileInstallAppSchema = z.object({
	apkPath: z.string(),
});

export class MobileInstallApp extends Request<
	Tool.MOBILE_INSTALL_APP,
	typeof mobileInstallAppSchema
> {
	public readonly info = {
		name: Tool.MOBILE_INSTALL_APP,
		description: 'Install APK via AWS Device Farm',
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
		const sessionArn = this.session.current.arn;
		const apkPath = path.isAbsolute(request.apkPath) ? request.apkPath : path.resolve(process.cwd(), request.apkPath);

		if (!fs.existsSync(apkPath)) throw new Error(`APK not found: ${apkPath}`);

		const fileName = path.basename(apkPath);
		const createUpCmd = new CreateUploadCommand({
			projectArn: this.projectARN,
			name: fileName,
			type: 'ANDROID_APP'
		});
		const upload = await this.deviceFarmClient.send(createUpCmd);
		await uploadToS3(upload.upload?.url as string, apkPath);

		let status = 'INITIALIZED';
		let attempts = 0;
		while (status !== 'SUCCEEDED' && status !== 'FAILED' && attempts < 30) {
			await new Promise(r => setTimeout(r, 2000));
			const getCmd = new GetUploadCommand({ arn: upload.upload?.arn });
			const uploadStatus = await this.deviceFarmClient.send(getCmd);
			status = uploadStatus.upload?.status as string;
			attempts++;
		}

		if (status !== 'SUCCEEDED') throw new Error('Upload failed');

		const installCmd = new InstallToRemoteAccessSessionCommand({
			remoteAccessSessionArn: sessionArn,
			appArn: upload.upload?.arn
		});

		await this.deviceFarmClient.send(installCmd);

		return `App installed successfully. ARN: ${upload.upload?.arn}`;
	}
}
