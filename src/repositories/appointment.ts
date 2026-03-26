import db from '../db';
import { v4 as uuidv4 } from 'uuid';
import { Appointment, CreateAppointmentInput, CreateAppointmentSchema, AppointmentSchema } from '../schemas/appointment';
import { z } from 'zod';

export const appointmentRepo = {

  createIfNoOverlap: (data: CreateAppointmentInput): Appointment => {
    const id = uuidv4();
    

    const transaction = db.transaction(() => {
      const overlap = db
        .prepare(`
          SELECT 1 FROM appointment
          WHERE clinicianId = ?
          AND start < ?
          AND end > ?
          LIMIT 1
        `)
        .get(data.clinicianId, data.end, data.start);

      if (overlap) {
        throw new Error('OVERLAP');
      }

      db.prepare(`
        INSERT INTO appointment (id, clinicianId, patientId, start, end)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, data.clinicianId, data.patientId, data.start, data.end);
    });

    db.exec('BEGIN IMMEDIATE');
    try {
      transaction();
      db.exec('COMMIT');
    } catch (err: any) {
      db.exec('ROLLBACK');
      if (err.message === 'OVERLAP') {
        throw err;
      }
      throw err;
    }

    return AppointmentSchema.parse({ id, ...data });
  },

  findOverlap: (clinicianId: string, start: number, end: number): boolean => {
    const row = db
      .prepare(`
        SELECT 1 FROM appointment
        WHERE clinicianId = ?
        AND start < ?
        AND end > ?
        LIMIT 1
      `)
      .get(clinicianId, end, start);

    return !!row;
  },

  insert: (data: CreateAppointmentInput): Appointment => {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO appointment (id, clinicianId, patientId, start, end)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, data.clinicianId, data.patientId, data.start, data.end);

    return AppointmentSchema.parse({ id, ...data });
  },

  listByClinician: (clinicianId: string, from?: number, to?: number): Appointment[] => {
    let sql = `SELECT * FROM appointment WHERE clinicianId = ? AND end >= ?`;
    const sqlParams = [clinicianId, from ?? Date.now()];

    if (to) {
      sql += ' AND start <= ?';
      sqlParams.push(to);
    }

    sql += ' ORDER BY start ASC';

    const rows = db.prepare(sql).all(...sqlParams) as unknown[];
    return z.array(AppointmentSchema).parse(rows);
  },

  listAll: (from?: number, to?: number): Appointment[] => {
    let sql = `SELECT * FROM appointment WHERE end >= ?`;
    const sqlParams = [from ?? Date.now()];

    if (to) {
      sql += ' AND start <= ?';
      sqlParams.push(to);
    }

    sql += ' ORDER BY start ASC';

    const rows = db.prepare(sql).all(...sqlParams) as unknown[];
    return z.array(AppointmentSchema).parse(rows);
  },
};