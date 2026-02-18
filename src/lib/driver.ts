import { Browser, remote } from 'webdriverio';

export class Driver {
	private connection?: Browser;

	/**
	 * Create a connection.
	 *
	 * @param deviceFarmURL
	 */
	public async connect(deviceFarmURL: string): Promise<void> {
		if (this.connection) {
			await this.disconnect();
		}

		const url = new URL(deviceFarmURL);

		this.connection = await remote({
			hostname: url.hostname,
			path: url.pathname,
			protocol: 'https',
			port: 443,
			capabilities: { platformName: 'Android', 'appium:automationName': 'UiAutomator2' },
			logLevel: 'silent'
		});
	}

	/**
	 * Disconnect current connection.
	 */
	public async disconnect(): Promise<void> {
		if (!this.connection) {
			throw new Error('No connection found.');
		}

		await this.connection.deleteSession();

		this.connection = undefined;
	}

	/**
	 * Retrieve the current connection.
	 *
	 * @throws Error - If no connection is found.
	 */
	public getConnection(): Browser {
		if (!this.connection) {
			throw new Error('No connection found.');
		}

		return this.connection;
	}
}
