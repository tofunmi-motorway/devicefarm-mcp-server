/**
 * Get value of an environment value.
 *
 * @param key
 * @param defaultValue
 */
export function get<T = unknown>(key: string, defaultValue?: T): T | undefined {
	const value = process.env[key] ?? defaultValue;

	return value === undefined ? undefined : (value as T);
}

/**
 * Get value of an environment variable or throw an error.
 *
 * @param key
 * @param defaultValue
 */
export function getOrThrow<T = unknown>(key: string, defaultValue?: T): T {
	const value = get<T>(key, defaultValue);

	if (value === undefined) {
		throw new Error(`Could not find environment variable '${key}'`);
	}

	return value;
}

export default {
	get,
	getOrThrow,
}
