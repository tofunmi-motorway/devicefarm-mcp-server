import { DeviceFarmClient, ListRemoteAccessSessionsCommand, RemoteAccessSession } from '@aws-sdk/client-device-farm';
import { z } from 'zod';
import { Request } from './request';
import { Tool } from '../enums/tool';
import { Driver } from '../lib/driver';
import { Session } from '../lib/session';

type Response = {
	arn: string;
	name: string;
	status: string;
	device?: string;
	created: Date;
	appiumEndpoint?: string;
}[]

const listActiveSessionsSchema = z.object({});

export class ListActiveSessions extends Request<Tool.LIST_ACTIVE_SESSIONS, typeof listActiveSessionsSchema> {
	public readonly info = {
		name: Tool.LIST_ACTIVE_SESSIONS,
		description: 'List active sessions',
		inputSchema: listActiveSessionsSchema,
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
	 * Handle list active session request.
	 */
	public async handle(): Promise<Response> {
		const listSessionsCmd = new ListRemoteAccessSessionsCommand({ arn: this.projectARN });
		const sessions = await this.deviceFarmClient.send(listSessionsCmd);

		const activeSessions: RemoteAccessSession[] = sessions.remoteAccessSessions?.filter(session =>
			['RUNNING', 'PENDING', 'PENDING_CONCURRENCY', 'PENDING_DEVICE', 'PREPARING'].includes(session.status as string)
		) || [];

		return activeSessions.map(s => ({
			arn: s.arn as string,
			name: s.name as string,
			status: s.status as string,
			device: s.device?.name,
			created: s.created as Date,
			appiumEndpoint: s.endpoints?.remoteDriverEndpoint
		}));
	}
}
