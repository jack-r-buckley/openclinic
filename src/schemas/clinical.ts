import { z } from 'zod';
import { IdSchema } from './common';

export const RoleSchema = z.enum(['clinician', 'admin']);

export const CreateClinicianSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: RoleSchema.default('clinician'),
});

export const ClinicianSchema = z.object({
  id: IdSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: RoleSchema,
});

export type CreateClinicianInput = z.infer<typeof CreateClinicianSchema>;
export type Clinician = z.infer<typeof ClinicianSchema>;