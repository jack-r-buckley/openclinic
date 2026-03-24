import { appointmentRepo } from '../repositories/appointment';
import { Appointment, CreateAppointmentInput } from '../schemas/appointment';
import { AppointmentValidationError, AppointmentConflictError, ClinicianNotFoundError } from '../utils/errors';
import { clinicianRepo } from '../repositories/clinician';
import { patientRepo } from '../repositories/patient';
import { CreateAppointmentRequest } from '../schemas/request';
import { isoToMs } from '../utils/time';

export const appointmentService = {

  createAppointment: (request: CreateAppointmentRequest): Appointment => {
    const now = Date.now();
    const startMs = isoToMs(request.start);
    const endMs = isoToMs(request.end);

    if (startMs < now) {
      throw new AppointmentValidationError('Appointment start time cannot be in the past');
    }

    const clinician = clinicianRepo.getById(request.clinicianId);
    if (!clinician) {
      throw new ClinicianNotFoundError(request.clinicianId);
    }

    let patient = patientRepo.getByEmail(request.patientEmail);
    if (!patient) {
      patient = patientRepo.create({
        email: request.patientEmail,
        firstName: request.patientFirstName,
        lastName: request.patientLastName,
      });
    }

    const hasOverlap = appointmentRepo.findOverlap(request.clinicianId, startMs, endMs);
    if (hasOverlap) {
      throw new AppointmentConflictError(
        'Appointment overlaps with an existing appointment for this clinician'
      );
    }

    const appointmentData: CreateAppointmentInput = {
      clinicianId: request.clinicianId,
      patientId: patient.id,
      start: startMs,
      end: endMs,
    };

    return appointmentRepo.insert(appointmentData);
  },

  listByClinician: (clinicianId: string, from?: number, to?: number): Appointment[] => {
    return appointmentRepo.listByClinician(clinicianId, from, to);
  },

  listAll: (from?: number, to?: number): Appointment[] => {
    return appointmentRepo.listAll(from, to);
  },
};
