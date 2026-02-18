import { Request } from './request';
import { Tool } from '../enums/tool';
import { Platform } from '../enums/platform';
import { z } from 'zod';
import { DeviceFarmClient, ListDevicesCommand, Device } from '@aws-sdk/client-device-farm';
import { Driver } from '../lib/driver';
import { Session } from '../lib/session';

type Response = {
	arn: string;
	name: string;
	platform: string;
	os: string;
	availability: string;
}[];

const listDevicesSchema = z.object({
	platform: z.enum(Platform).optional(),
});

export class ListDevices extends Request<Tool.LIST_DEVICES, typeof listDevicesSchema> {
	public readonly info = {
		name: Tool.LIST_DEVICES,
		description: 'List available devices',
		inputSchema: listDevicesSchema,
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
	 * Handle list devices request.
	 */
	public async handle(request: z.infer<typeof listDevicesSchema>): Promise<Response> {
		const listDevCmd = new ListDevicesCommand({ arn: this.projectARN });
		const devList = await this.deviceFarmClient.send(listDevCmd);

		const filtered: Device[] = devList.devices?.filter(d =>
			!request.platform || d.platform === request.platform
		) || [];

		return filtered.map(device => ({
			arn: device.arn as string,
			name: device.name as string,
			platform: device.platform as string,
			os: device.os as string,
			availability: device.availability as string
		}));
	}
}
