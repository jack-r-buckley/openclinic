import { z } from 'zod';
import { IdSchema, IsoDatetimeSchema } from './common';

// Request to create an appointment with patient details
export const CreateAppointmentRequestSchema = z.object({
  clinicianId: IdSchema,
  patientEmail: z.string().email(),
  patientFirstName: z.string().min(1).max(100),
  patientLastName: z.string().min(1).max(100),
  start: IsoDatetimeSchema,
  end: IsoDatetimeSchema,
}).refine(
  (data) => new Date(data.start).getTime() < new Date(data.end).getTime(),
  {
    message: 'appointment start time must be before end time',
    path: ['start'],
  }
);

// Query parameters for date range filtering
export const DateRangeQuerySchema = z.object({
  from: IsoDatetimeSchema.optional(),
  to: IsoDatetimeSchema.optional(),
});

export type CreateAppointmentRequest = z.infer<typeof CreateAppointmentRequestSchema>;
export type DateRangeQuery = z.infer<typeof DateRangeQuerySchema>;