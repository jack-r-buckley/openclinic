import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import db from '../db';

const clearDb = () => {
  db.prepare('DELETE FROM appointment').run();
  db.prepare('DELETE FROM patient').run();
  db.prepare('DELETE FROM clinician').run();
};

describe('Business Logic Tests', () => {
  beforeEach(() => {
    clearDb();
  });

  // Past appointment rejection
  describe('Past Appointment Rules', () => {
    let clinician: any;

    beforeEach(async () => {
      const res = await request(app).post('/clinician').send({
        firstName: 'John',
        lastName: 'Smith',
      });
      clinician = res.body;
    });

    it('should reject appointment starting in the past', async () => {
      const pastStart = new Date(Date.now() - 3600000).toISOString();
      const futureEnd = new Date(Date.now() + 1800000).toISOString();

      const res = await request(app).post('/appointment').send({
        clinicianId: clinician.id,
        patientEmail: 'patient@example.com',
        patientFirstName: 'Jane',
        patientLastName: 'Doe',
        start: pastStart,
        end: futureEnd,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('cannot be in the past');
    });

    it('should reject appointment completely in the past', async () => {
      const pastStart = new Date(Date.now() - 7200000).toISOString();
      const pastEnd = new Date(Date.now() - 3600000).toISOString();

      const res = await request(app).post('/appointment').send({
        clinicianId: clinician.id,
        patientEmail: 'patient@example.com',
        patientFirstName: 'Jane',
        patientLastName: 'Doe',
        start: pastStart,
        end: pastEnd,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('cannot be in the past');
    });
  });

  // Clinician not found
  describe('Clinician Existence', () => {
    it('should reject appointment for non-existent clinician', async () => {
      // Use a valid UUID that doesn't exist in the database
      const fakeClinicianId = '00000000-0000-4000-8000-000000000000';
      const start = new Date(Date.now() + 3600000).toISOString();
      const end = new Date(Date.now() + 5400000).toISOString();

      const res = await request(app).post('/appointment').send({
        clinicianId: fakeClinicianId,
        patientEmail: 'patient@example.com',
        patientFirstName: 'Jane',
        patientLastName: 'Doe',
        start,
        end,
      });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });
  });

  // Overlap detection
  describe('Appointment Overlap Detection', () => {
    let clinician: any;

    beforeEach(async () => {
      const res = await request(app).post('/clinician').send({
        firstName: 'John',
        lastName: 'Smith',
      });
      clinician = res.body;
    });

    it('should prevent partial overlap with existing appointment', async () => {
      const apptStart = new Date(Date.now() + 3600000).getTime();
      const apptEnd = new Date(Date.now() + 7200000).getTime();

      // Create first appointment
      await request(app).post('/appointment').send({
        clinicianId: clinician.id,
        patientEmail: 'patient1@example.com',
        patientFirstName: 'Jane',
        patientLastName: 'Doe',
        start: new Date(apptStart).toISOString(),
        end: new Date(apptEnd).toISOString(),
      });

      // Try to create overlapping appointment
      const overlapStart = new Date(apptStart + 1800000).toISOString();
      const overlapEnd = new Date(apptEnd + 3600000).toISOString();

      const res = await request(app).post('/appointment').send({
        clinicianId: clinician.id,
        patientEmail: 'patient2@example.com',
        patientFirstName: 'John',
        patientLastName: 'Smith',
        start: overlapStart,
        end: overlapEnd,
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('overlaps');
    });

    it('should allow appointment at exact endpoint boundary (end == start)', async () => {
      const apptStart = new Date(Date.now() + 3600000).getTime();
      const apptEnd = new Date(Date.now() + 7200000).getTime();

      // Create first appointment
      await request(app).post('/appointment').send({
        clinicianId: clinician.id,
        patientEmail: 'patient1@example.com',
        patientFirstName: 'Jane',
        patientLastName: 'Doe',
        start: new Date(apptStart).toISOString(),
        end: new Date(apptEnd).toISOString(),
      });

      // Create second appointment that starts exactly when first ends
      const secondStart = new Date(apptEnd).toISOString();
      const secondEnd = new Date(apptEnd + 3600000).toISOString();

      const res = await request(app).post('/appointment').send({
        clinicianId: clinician.id,
        patientEmail: 'patient2@example.com',
        patientFirstName: 'John',
        patientLastName: 'Smith',
        start: secondStart,
        end: secondEnd,
      });

      expect(res.status).toBe(201);
    });

    it('should allow appointment before existing appointment', async () => {
      const apptStart = new Date(Date.now() + 7200000).getTime();
      const apptEnd = new Date(Date.now() + 10800000).getTime();

      // Create first appointment far in the future
      await request(app).post('/appointment').send({
        clinicianId: clinician.id,
        patientEmail: 'patient1@example.com',
        patientFirstName: 'Jane',
        patientLastName: 'Doe',
        start: new Date(apptStart).toISOString(),
        end: new Date(apptEnd).toISOString(),
      });

      // Create appointment before it
      const beforeStart = new Date(Date.now() + 3600000).toISOString();
      const beforeEnd = new Date(Date.now() + 5400000).toISOString();

      const res = await request(app).post('/appointment').send({
        clinicianId: clinician.id,
        patientEmail: 'patient2@example.com',
        patientFirstName: 'John',
        patientLastName: 'Smith',
        start: beforeStart,
        end: beforeEnd,
      });

      expect(res.status).toBe(201);
    });

    it('should not prevent same appointment for different clinicians', async () => {
      const clinician1Res = await request(app).post('/clinician').send({
        firstName: 'Alice',
        lastName: 'Johnson',
      });
      const clinician1 = clinician1Res.body;

      const clinician2Res = await request(app).post('/clinician').send({
        firstName: 'Bob',
        lastName: 'Smith',
      });
      const clinician2 = clinician2Res.body;

      const apptStart = new Date(Date.now() + 3600000).toISOString();
      const apptEnd = new Date(Date.now() + 5400000).toISOString();

      // Create appointment for clinician 1
      await request(app).post('/appointment').send({
        clinicianId: clinician1.id,
        patientEmail: 'patient1@example.com',
        patientFirstName: 'Jane',
        patientLastName: 'Doe',
        start: apptStart,
        end: apptEnd,
      });

      // Create same time appointment for clinician 2
      const res = await request(app).post('/appointment').send({
        clinicianId: clinician2.id,
        patientEmail: 'patient2@example.com',
        patientFirstName: 'John',
        patientLastName: 'Smith',
        start: apptStart,
        end: apptEnd,
      });

      expect(res.status).toBe(201);
    });
  });

  // Patient auto-creation
  describe('Patient Auto-Creation', () => {
    let clinician: any;

    beforeEach(async () => {
      const res = await request(app).post('/clinician').send({
        firstName: 'John',
        lastName: 'Smith',
      });
      clinician = res.body;
    });

    it('should auto-create patient if not found by email', async () => {
      const start = new Date(Date.now() + 3600000).toISOString();
      const end = new Date(Date.now() + 5400000).toISOString();

      const res = await request(app).post('/appointment').send({
        clinicianId: clinician.id,
        patientEmail: 'newpatient@example.com',
        patientFirstName: 'New',
        patientLastName: 'Patient',
        start,
        end,
      });

      expect(res.status).toBe(201);
      expect(res.body.patientId).toBeDefined();
    });

    it('should reuse existing patient by email', async () => {
      const start1 = new Date(Date.now() + 3600000).toISOString();
      const end1 = new Date(Date.now() + 5400000).toISOString();

      // Create first appointment
      const res1 = await request(app).post('/appointment').send({
        clinicianId: clinician.id,
        patientEmail: 'patient@example.com',
        patientFirstName: 'John',
        patientLastName: 'Doe',
        start: start1,
        end: end1,
      });

      const patientId1 = res1.body.patientId;

      // Create another clinician
      const clinician2Res = await request(app).post('/clinician').send({
        firstName: 'Alice',
        lastName: 'Johnson',
      });
      const clinician2 = clinician2Res.body;

      const start2 = new Date(Date.now() + 7200000).toISOString();
      const end2 = new Date(Date.now() + 9000000).toISOString();

      // Create second appointment with same email (should reuse patient)
      const res2 = await request(app).post('/appointment').send({
        clinicianId: clinician2.id,
        patientEmail: 'patient@example.com',
        patientFirstName: 'Different', // Different name shouldn't override
        patientLastName: 'Names',
        start: start2,
        end: end2,
      });

      expect(res2.body.patientId).toBe(patientId1);
    });
  });
});
