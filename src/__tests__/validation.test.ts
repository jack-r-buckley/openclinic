import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import db from '../db';

const clearDb = () => {
  db.prepare('DELETE FROM appointment').run();
  db.prepare('DELETE FROM patient').run();
  db.prepare('DELETE FROM clinician').run();
};

describe('Input Validation Tests', () => {
  beforeEach(() => {
    clearDb();
  });

  // Clinician creation validation
  describe('Clinician Creation', () => {
    it('should reject clinician with missing firstName', async () => {
      const res = await request(app).post('/clinician').send({
        lastName: 'Smith',
        role: 'clinician',
      });

      expect(res.status).toBe(400);
      expect(res.body.details).toBeDefined();
    });

    it('should reject clinician with empty firstName', async () => {
      const res = await request(app).post('/clinician').send({
        firstName: '',
        lastName: 'Smith',
        role: 'clinician',
      });

      expect(res.status).toBe(400);
    });

    it('should reject clinician with firstName > 100 chars', async () => {
      const res = await request(app).post('/clinician').send({
        firstName: 'a'.repeat(101),
        lastName: 'Smith',
        role: 'clinician',
      });

      expect(res.status).toBe(400);
    });

    it('should reject clinician with invalid role', async () => {
      const res = await request(app).post('/clinician').send({
        firstName: 'John',
        lastName: 'Smith',
        role: 'patient',
      });

      expect(res.status).toBe(400);
    });
  });

  // Patient creation validation
  describe('Patient Creation', () => {
    it('should reject patient with invalid email', async () => {
      const res = await request(app).post('/patient').send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'not-an-email',
      });

      expect(res.status).toBe(400);
    });

    it('should reject patient with missing email', async () => {
      const res = await request(app).post('/patient').send({
        firstName: 'Jane',
        lastName: 'Doe',
      });

      expect(res.status).toBe(400);
    });

    it('should reject patient with lastName > 100 chars', async () => {
      const res = await request(app).post('/patient').send({
        firstName: 'Jane',
        lastName: 'b'.repeat(101),
        email: 'jane@example.com',
      });

      expect(res.status).toBe(400);
    });
  });

  // Appointment creation validation
  describe('Appointment Creation', () => {
    let clinician: any;

    beforeEach(async () => {
      const res = await request(app).post('/clinician').send({
        firstName: 'John',
        lastName: 'Smith',
      });
      clinician = res.body;
    });

    it('should reject appointment with invalid email', async () => {
      const start = new Date(Date.now() + 3600000).toISOString();
      const end = new Date(Date.now() + 5400000).toISOString();

      const res = await request(app).post('/appointment').send({
        clinicianId: clinician.id,
        patientEmail: 'invalid-email',
        patientFirstName: 'John',
        patientLastName: 'Doe',
        start,
        end,
      });

      expect(res.status).toBe(400);
    });

    it('should reject appointment with invalid UUID clinicianId', async () => {
      const start = new Date(Date.now() + 3600000).toISOString();
      const end = new Date(Date.now() + 5400000).toISOString();

      const res = await request(app).post('/appointment').send({
        clinicianId: 'not-a-uuid',
        patientEmail: 'patient@example.com',
        patientFirstName: 'John',
        patientLastName: 'Doe',
        start,
        end,
      });

      expect(res.status).toBe(400);
    });

    it('should reject appointment with invalid ISO datetime format', async () => {
      const res = await request(app).post('/appointment').send({
        clinicianId: clinician.id,
        patientEmail: 'patient@example.com',
        patientFirstName: 'John',
        patientLastName: 'Doe',
        start: 'not-a-date',
        end: '2026-03-24T15:00:00Z',
      });

      expect(res.status).toBe(400);
    });

    it('should reject appointment with empty patientFirstName', async () => {
      const start = new Date(Date.now() + 3600000).toISOString();
      const end = new Date(Date.now() + 5400000).toISOString();

      const res = await request(app).post('/appointment').send({
        clinicianId: clinician.id,
        patientEmail: 'patient@example.com',
        patientFirstName: '',
        patientLastName: 'Doe',
        start,
        end,
      });

      expect(res.status).toBe(400);
    });

    it('should reject appointment with end before start', async () => {
      const start = new Date(Date.now() + 5400000).toISOString();
      const end = new Date(Date.now() + 3600000).toISOString();

      const res = await request(app).post('/appointment').send({
        clinicianId: clinician.id,
        patientEmail: 'patient@example.com',
        patientFirstName: 'John',
        patientLastName: 'Doe',
        start,
        end,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should reject appointment with identical start and end times', async () => {
      const time = new Date(Date.now() + 3600000).toISOString();

      const res = await request(app).post('/appointment').send({
        clinicianId: clinician.id,
        patientEmail: 'patient@example.com',
        patientFirstName: 'John',
        patientLastName: 'Doe',
        start: time,
        end: time,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  // Query parameter validation
  describe('Query Parameter Validation', () => {
    let clinician: any;

    beforeEach(async () => {
      const res = await request(app).post('/clinician').send({
        firstName: 'John',
        lastName: 'Smith',
      });
      clinician = res.body;
    });

    it('should reject invalid ISO datetime in from query param', async () => {
      const res = await request(app)
        .get(`/appointment/clinician/${clinician.id}`)
        .query({ from: 'invalid-date' })
        .set('X-Role', 'clinician');

      expect(res.status).toBe(400);
    });

    it('should reject invalid ISO datetime in to query param', async () => {
      const res = await request(app)
        .get(`/appointment/clinician/${clinician.id}`)
        .query({ to: 'invalid-date' })
        .set('X-Role', 'clinician');

      expect(res.status).toBe(400);
    });
  });
});
