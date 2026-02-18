import { Tool } from '../enums/tool';
import { Request } from '../requests/request';
import { z } from 'zod';

export type Handlers = {
	[K in Tool]: Request<K, z.ZodTypeAny>;
};

// Helper type to ensure all Tool values are present
type RequireAllKeys<T> = {
	[K in keyof T]-?: T[K];
};

export type AllHandlers = RequireAllKeys<Handlers>;
