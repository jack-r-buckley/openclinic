export class AppointmentConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppointmentConflictError';
  }
}

export class AppointmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppointmentValidationError';
  }
}

export class ClinicianNotFoundError extends Error {
  constructor(clinicianId: string) {
    super(`Clinician with ID ${clinicianId} not found`);
    this.name = 'ClinicianNotFoundError';
  }
}
