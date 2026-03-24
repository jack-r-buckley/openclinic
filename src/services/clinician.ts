import { clinicianRepo } from '../repositories/clinician';
import { ClinicianNotFoundError } from '../utils/errors';
import { Clinician, CreateClinicianInput } from '../schemas/clinical';

export const clinicianService = {
  create: (data: CreateClinicianInput): Clinician => {
    return clinicianRepo.create(data);
  },

  getByIdOrThrow: (id: string) => {
    const clinician = clinicianRepo.getById(id);
    if (!clinician) {
      throw new ClinicianNotFoundError(id);
    }
    return clinician;
  },
};
