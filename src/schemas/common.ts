import { z } from 'zod';

export const IdSchema = z.uuid();

export const IsoDatetimeSchema = z.iso.datetime();