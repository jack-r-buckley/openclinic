import { patientRepo } from '../repositories/patient';
import { Patient, CreatePatientInput } from '../schemas/patient';

export const patientService = {
  create: (data: CreatePatientInput): Patient => {
    return patientRepo.create(data);
  },

  getByEmail: (email: string): Patient | null => {
    return patientRepo.getByEmail(email);
  },
};
