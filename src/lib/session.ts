import { RemoteAccessSession } from '@aws-sdk/client-device-farm';

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
}
