import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import db from '../db';

// Helper to clear all tables
const clearDb = () => {
  db.prepare('DELETE FROM appointment').run();
  db.prepare('DELETE FROM patient').run();
  db.prepare('DELETE FROM clinician').run();
};

// Helper to create a clinician
const createClinician = async (data: { firstName: string; lastName: string; role?: string }) => {
  const res = await request(app).post('/clinician').send(data);
  return res.body;
};

// Helper to create an appointment
const createAppointment = async (data: {
  clinicianId: string;
  patientEmail: string;
  patientFirstName: string;
  patientLastName: string;
  start: string;
  end: string;
}) => {
  return request(app).post('/appointment').send(data);
};

// Helper to list clinician appointments
const listClinicianAppointments = async (clinicianId: string, role: string = 'clinician') => {
  return request(app)
    .get(`/appointment/clinician/${clinicianId}`)
    .set('X-Role', role);
};

// Helper to list all appointments
const listAllAppointments = async (role: string) => {
  return request(app).get('/appointment').set('X-Role', role);
};

describe('Appointment Happy Path Integration', () => {
  beforeAll(() => {
    clearDb();
  });

  let adminClinician: any;
  let clinicianA: any;
  let clinicianB: any;

  it('should create an admin clinician', async () => {
    const res = await createClinician({
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    });

    expect(res.id).toBeDefined();
    expect(res.role).toBe('admin');
    adminClinician = res;
  });

  it('should create clinician A', async () => {
    const res = await createClinician({
      firstName: 'Alice',
      lastName: 'Johnson',
      role: 'clinician',
    });

    expect(res.id).toBeDefined();
    expect(res.role).toBe('clinician');
    clinicianA = res;
  });

  it('should create clinician B', async () => {
    const res = await createClinician({
      firstName: 'Bob',
      lastName: 'Smith',
      role: 'clinician',
    });

    expect(res.id).toBeDefined();
    expect(res.role).toBe('clinician');
    clinicianB = res;
  });

  it('should create future appointment for clinician A', async () => {
    const start = new Date(Date.now() + 3600000).toISOString();
    const end = new Date(Date.now() + 5400000).toISOString();

    const res = await createAppointment({
      clinicianId: clinicianA.id,
      patientEmail: 'patient1@example.com',
      patientFirstName: 'John',
      patientLastName: 'Doe',
      start,
      end,
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.clinicianId).toBe(clinicianA.id);
  });

  it('should create first future appointment for clinician B', async () => {
    const start = new Date(Date.now() + 7200000).toISOString();
    const end = new Date(Date.now() + 9000000).toISOString();

    const res = await createAppointment({
      clinicianId: clinicianB.id,
      patientEmail: 'patient2@example.com',
      patientFirstName: 'Jane',
      patientLastName: 'Smith',
      start,
      end,
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  it('should create non-overlapping second appointment for clinician B', async () => {
    const start = new Date(Date.now() + 10800000).toISOString();
    const end = new Date(Date.now() + 12600000).toISOString();

    const res = await createAppointment({
      clinicianId: clinicianB.id,
      patientEmail: 'patient4@example.com',
      patientFirstName: 'Sarah',
      patientLastName: 'Wilson',
      start,
      end,
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  it('should list 2 appointments for clinician B', async () => {
    const res = await listClinicianAppointments(clinicianB.id);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.every((appt: any) => appt.clinicianId === clinicianB.id)).toBe(true);
  });

  it('should list all 3 appointments as admin', async () => {
    const res = await listAllAppointments('admin');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });

  it('should support date range filtering on appointment list', async () => {
    const now = Date.now();
    const from = new Date(now + 6000000).toISOString(); // Slightly before first appt
    const to = new Date(now + 11000000).toISOString();

    const res = await request(app)
      .get('/appointment')
      .set('X-Role', 'admin')
      .query({ from, to });

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
