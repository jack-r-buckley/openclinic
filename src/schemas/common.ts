import { z } from 'zod';

export const IdSchema = z.uuid();

// ISO 8601 datetime string (validated but not coerced to ms - conversion happens in service)
export const IsoDatetimeSchema = z.string().datetime();