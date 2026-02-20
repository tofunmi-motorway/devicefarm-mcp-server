import { Browser, remote } from 'webdriverio';
import { Platform } from '../enums/platform';
import { waitFor } from './wait-for';

export class Driver {
	private static readonly ALIVE = 'ALIVE';
	private static readonly DEAD = 'DEAD';

	private connection?: Browser;
	private props?: {
		platform: Platform;
		deviceFarmURL: string;
	};

	/**
	 * Create a connection.
	 *
	 * @param deviceFarmURL
	 * @param platform
	 */
	public async connect(
		deviceFarmURL: string,
		platform: Platform,
	): Promise<void> {
		if (this.connection) {
			await this.disconnect();
		}

		this.props = {
			deviceFarmURL,
			platform,
		}

		await this.refresh();
	}

	/**
	 * Disconnect current connection.
	 */
	public async disconnect(): Promise<void> {
		if (!this.connection) {
			return;
		}

		await this.connection.deleteSession();

		this.connection = undefined;
		this.props = undefined;
	}

	/**
	 * Retrieve the current connection.
	 *
	 * @throws Error - If no connection is found.
	 */
	public async getConnection(): Promise<Browser> {
		if (!this.connection) {
			throw new Error('No connection found.');
		}

		// Refresh session if not alive.
		try {
			await this.checkSessionStatus();
		} catch (error) {
			console.error('Session is dead, refreshing automatically getConnection():', error);
			await this.refresh();
		}

		return this.connection;
	}

	/**
	 * Refresh the browser connection.
	 */
	public async refresh(): Promise<void> {
		if (!this.props) {
			throw new Error('Required url and platform not found');
		}

		const url = new URL(this.props.deviceFarmURL);

		this.connection = await remote({
			hostname: url.hostname,
			path: url.pathname,
			protocol: 'https',
			port: 443,
			capabilities: this.getCapabilities(this.props.platform),
			logLevel: 'silent'
		});

		// Wait for WDA to be fully ready (iOS only)
		if (this.props.platform === Platform.IOS) {
			await this.waitForWDAReady(this.props.deviceFarmURL);

			console.error('DEBUG: WDA is ready!');
		}
	}

	/**
	 * Get the capabilities for the given platform.
	 *
	 * @param platform
	 * @private
	 */
	private getCapabilities(platform: Platform): Record<string, string> {
		const platformCapabilities: Record<Platform, Record<string, string>> = {
			[Platform.ANDROID]: { platformName: 'Android', 'appium:automationName': 'UiAutomator2' },
			[Platform.IOS]: { platformName: 'iOS', 'appium:automationName': 'XCUITest' },
		};

		return platformCapabilities[platform];
	}

	/**
	 * Wait for WebDriverAgent to be ready by polling /status endpoint.
	 *
	 * @param appiumUrl
	 * @private
	 */
	private async waitForWDAReady(appiumUrl: string): Promise<void> {
		const statusUrl = `${appiumUrl}/status`;

		await waitFor(async () => {
			try {
				const status = await this.checkSessionStatus();

				return {
					status,
				}
			} catch (error) {
				// WDA not ready yet.
				console.error('WDA not ready yet waitForWDAReady():', error);

				return {
					status: Driver.DEAD,
				};
			}
		}, {
			acceptableStatuses: [Driver.ALIVE],
			maxAttempts: 30,
			intervalMs: 1000,
			timeoutMessage: `WDA failed to become ready after 30 seconds: ${statusUrl}`,
			delayStart: false,
		});
	}

	/**
	 * Check if the session is still alive.
	 * @private
	 */
	private async checkSessionStatus(): Promise<string> {
		const statusUrl = `${this.props?.deviceFarmURL}/status`;

		const response = await fetch(statusUrl);

		if (!response.ok) {
			throw new Error(`Response was not ok: ${response.status}`);
		}

		const data = await response.json() as {
			value?: {
				ready?: unknown;
				build?: unknown;
			};
		};

		if (!data.value?.ready && !data.value?.build) {
			throw new Error(`Not ready yet: ${JSON.stringify(data.value ?? {})}`);
		}

		return Driver.ALIVE;
	}
}
