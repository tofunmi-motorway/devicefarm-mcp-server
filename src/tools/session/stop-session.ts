import { BaseTool } from '../base-tool';
import { Tool } from '../../enums/tool';
import { z } from 'zod';
import { DeviceFarmClient, StopRemoteAccessSessionCommand } from '@aws-sdk/client-device-farm';
import { Driver } from '../../lib/driver';
import { Session } from '../../lib/session';

const stopSessionSchema = z.object({});

export class StopSession extends BaseTool<Tool.STOP_SESSION, typeof stopSessionSchema> {
	public readonly info = {
		name: Tool.STOP_SESSION,
		description: 'Stop current session',
		inputSchema: stopSessionSchema,
	} as const;

	constructor(
		driver: Driver,
		session: Session,
		private readonly deviceFarmClient: DeviceFarmClient,
	) {
		super(driver, session);
	}

	/**
	 * Handle stop session request.
	 */
	public async handle(request: z.infer<typeof stopSessionSchema>): Promise<string> {
		const sessionArn = this.session.current.arn;

		const stopCmd = new StopRemoteAccessSessionCommand({ arn: sessionArn });
		await this.deviceFarmClient.send(stopCmd);

		await this.driver.disconnect();
		this.session.stop();

		return 'Session stopped';
	}
}
