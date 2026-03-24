import { z } from 'zod';
import { IdSchema } from './common';

// Internal representation: millisecond timestamps
const TimestampSchema = z.number().int().nonnegative();

export const CreateAppointmentSchema = z.object({
  clinicianId: IdSchema,
  patientId: IdSchema,
  start: TimestampSchema,
  end: TimestampSchema,
});

export const AppointmentSchema = z.object({
  id: IdSchema,
  clinicianId: IdSchema,
  patientId: IdSchema,
  start: TimestampSchema,
  end: TimestampSchema,
});

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;
export type Appointment = z.infer<typeof AppointmentSchema>;