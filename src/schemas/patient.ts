import { z } from 'zod';
import { IdSchema } from './common';


export const CreatePatientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
});

export const PatientSchema = z.object({
  id: IdSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
});

export type CreatePatientInput = z.infer<typeof CreatePatientSchema>;
export type Patient = z.infer<typeof PatientSchema>;