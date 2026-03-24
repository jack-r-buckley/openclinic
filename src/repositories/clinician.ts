import db from '../db';
import { v4 as uuidv4 } from 'uuid';
import { Clinician, CreateClinicianInput, ClinicianSchema } from '../schemas/clinical';

export const clinicianRepo = {
  create: (data: CreateClinicianInput): Clinician => {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO clinician (id, firstName, lastName, role)
      VALUES (?, ?, ?, ?)
    `).run(id, data.firstName, data.lastName, data.role);

    return ClinicianSchema.parse({ id, ...data });
  },

  getById: (id: string): Clinician | null => {
    const row = db.prepare(`
      SELECT * FROM clinician WHERE id = ?
    `).get(id) as unknown;

    if (!row) return null;
    return ClinicianSchema.parse(row);
  },
};
