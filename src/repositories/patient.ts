import db from '../db';
import { v4 as uuidv4 } from 'uuid';
import { Patient, CreatePatientInput, PatientSchema } from '../schemas/patient';

export const patientRepo = {
  create: (data: CreatePatientInput): Patient => {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO patient (id, firstName, lastName, email)
      VALUES (?, ?, ?, ?)
    `).run(id, data.firstName, data.lastName, data.email);

    return PatientSchema.parse({ id, ...data });
  },

  getByEmail: (email: string): Patient | null => {
    const row = db.prepare(`
      SELECT * FROM patient WHERE email = ?
    `).get(email) as unknown;

    if (!row) return null;
    return PatientSchema.parse(row);
  },
};
