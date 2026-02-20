type OptionalData<T> = T extends undefined
	? { status: string }
	: { status: string; data: T };

/**
 * Waits for status of an operation to become acceptable.
 *
 * @param fetchStatus
 * @param options
 */
export async function waitFor<T = undefined>(
	fetchStatus: () => Promise<OptionalData<T>>,
	options: {
		acceptableStatuses: string[];
		maxAttempts?: number;
		intervalMs?: number;
		timeoutMessage?: string;
		/**
		 * If true, waits before the first status check (default). If false,
		 * checks status immediately, then waits between subsequent checks.
		 * Use false when the operation has just been triggered and may
		 * already be complete.
		 */
		delayStart?: boolean;
	}
): Promise<OptionalData<T>> {
	const {
		acceptableStatuses,
		maxAttempts = 30,
		intervalMs = 1000,
		timeoutMessage = 'Operation timed out',
		delayStart = true,
	} = options;

	let attempts = 0;

	while (attempts < maxAttempts) {
		// delay at the start instead of end if requested.
		delayStart && await new Promise(r => setTimeout(r, intervalMs));

		const result = await fetchStatus();

		if (acceptableStatuses.includes(result.status)) {
			return result;
		}

		// delay at the end if not delaying at the start.
		!delayStart && await new Promise(r => setTimeout(r, intervalMs));

		attempts++;
	}

	throw new Error(timeoutMessage);
}
