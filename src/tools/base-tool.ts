import { z } from 'zod';
import type { Tool } from '../enums/tool';
import { Driver } from '../lib/driver';
import { Session } from '../lib/session';

export abstract class BaseTool<
	T extends Tool,
	Schema extends z.ZodType
> {
	public readonly abstract info: {
		name: T;
		description: string;
		inputSchema: Schema;
	}

	constructor(
		protected readonly driver: Driver,
		protected readonly session: Session,
	) {}

	public abstract handle(request: z.infer<Schema>): Promise<unknown>;
}
