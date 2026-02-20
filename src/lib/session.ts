import { RemoteAccessSession } from '@aws-sdk/client-device-farm';
import { Platform } from '../enums/platform';

export class Session {
	private currentSession?: NonNullable<RemoteAccessSession>;

	/**
	 * Start a new session.
	 */
	public start(session: RemoteAccessSession): void {
		this.currentSession = session;
	}

	/**
	 * Stop the current session.
	 */
	public stop(): void {
		this.currentSession = undefined;
	}

	/**
	 * Get the current session.
	 */
	public get current(): RemoteAccessSession {
		if (!this.currentSession) {
			throw new Error('Session has not started');
		}

		return this.currentSession;
	}

	/**
	 * Return the device of the current session.
	 * This will exist if there is a session.
	 */
	public get device(): NonNullable<RemoteAccessSession['device']> {
		return this.current.device!;
	}

	/**
	 * Return the platform of the current session
	 */
	public get platform(): Platform {
		return this.device.platform as Platform;
	}
}
