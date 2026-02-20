import { Tool } from '../enums/tool';
import { BaseTool } from '../tools/base-tool';
import { z } from 'zod';

export type Handlers = {
	[K in Tool]: BaseTool<K, z.ZodTypeAny>;
};

// Helper type to ensure all Tool values are present
type RequireAllKeys<T> = {
	[K in keyof T]-?: T[K];
};

export type AllHandlers = RequireAllKeys<Handlers>;
