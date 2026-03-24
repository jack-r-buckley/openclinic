import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Worker } from 'worker_threads';
import { createServer } from 'http';
import app from '../index';
import db from '../db';

const clearDb = () => {
  db.prepare('DELETE FROM appointment').run();
  db.prepare('DELETE FROM patient').run();
  db.prepare('DELETE FROM clinician').run();
};

let server: ReturnType<typeof createServer>;
let port: number;

beforeAll(() => {
  // Start Express server on random available port for worker thread access
  server = createServer(app);
  return new Promise<void>((resolve) => {
    server.listen(0, 'localhost', () => {
      port = (server.address() as any).port;
      resolve();
    });
  });
});

afterAll(() => {
  return new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
});

describe('Concurrency Tests with Worker Threads', () => {
  beforeEach(() => {
    clearDb();
  });

  it('should prevent overlapping appointments from concurrent worker threads', async () => {
    // Create a clinician
    const clinicianRes = await fetch(`http://localhost:${port}/clinician`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Role': 'admin' },
      body: JSON.stringify({
        firstName: 'John',
        lastName: 'Smith',
      }),
    });
    const { id: clinicianId } = await clinicianRes.json();

    // Two overlapping appointment slots
    const start1 = new Date(Date.now() + 3600000).toISOString();
    const end1 = new Date(Date.now() + 5400000).toISOString();

    const start2 = new Date(Date.now() + 4000000).toISOString(); // Overlaps with first
    const end2 = new Date(Date.now() + 6000000).toISOString();

    // Spawn two separate worker threads (true OS-level concurrency)
    const [res1, res2] = await Promise.all([
      spawnWorkerRequest(port, {
        clinicianId,
        patientEmail: 'patient1@example.com',
        patientFirstName: 'Patient',
        patientLastName: 'One',
        start: start1,
        end: end1,
      }),
      spawnWorkerRequest(port, {
        clinicianId,
        patientEmail: 'patient2@example.com',
        patientFirstName: 'Patient',
        patientLastName: 'Two',
        start: start2,
        end: end2,
      }),
    ]);

    // Both requests complete, but exactly one should succeed (201) and one should fail (409)
    const statuses = [res1.status, res2.status].sort();

    expect(statuses).toEqual([201, 409]);
    const failedResponse = res1.status === 409 ? res1 : res2;
    expect(failedResponse.body.error).toContain('overlaps');
  });

  it('should allow multiple concurrent non-overlapping appointments from worker threads', async () => {
    // Create two clinicians
    const clinician1Res = await fetch(`http://localhost:${port}/clinician`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Role': 'admin' },
      body: JSON.stringify({
        firstName: 'John',
        lastName: 'Smith',
      }),
    });
    const { id: clinicianId1 } = await clinician1Res.json();

    const clinician2Res = await fetch(`http://localhost:${port}/clinician`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Role': 'admin' },
      body: JSON.stringify({
        firstName: 'Alice',
        lastName: 'Johnson',
      }),
    });
    const { id: clinicianId2 } = await clinician2Res.json();

    // Same time slot but different clinicians
    const start = new Date(Date.now() + 3600000).toISOString();
    const end = new Date(Date.now() + 5400000).toISOString();

    const [res1, res2] = await Promise.all([
      spawnWorkerRequest(port, {
        clinicianId: clinicianId1,
        patientEmail: 'patient1@example.com',
        patientFirstName: 'Patient',
        patientLastName: 'One',
        start,
        end,
      }),
      spawnWorkerRequest(port, {
        clinicianId: clinicianId2,
        patientEmail: 'patient2@example.com',
        patientFirstName: 'Patient',
        patientLastName: 'Two',
        start,
        end,
      }),
    ]);

    // Both should succeed (different clinicians, no conflict)
    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
    expect(res1.body.id).toBeDefined();
    expect(res2.body.id).toBeDefined();
  });

  it('should handle concurrent overlapping appointments from 5 worker threads safely', async () => {
    const clinicianRes = await fetch(`http://localhost:${port}/clinician`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Role': 'admin' },
      body: JSON.stringify({
        firstName: 'John',
        lastName: 'Smith',
      }),
    });
    const { id: clinicianId } = await clinicianRes.json();

    const start = new Date(Date.now() + 3600000).toISOString();
    const end = new Date(Date.now() + 5400000).toISOString();

    // Spawn 5 separate worker threads trying to book the same slot
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        spawnWorkerRequest(port, {
          clinicianId,
          patientEmail: `patient${i}@example.com`,
          patientFirstName: `Patient`,
          patientLastName: `${i}`,
          start,
          end,
        })
      )
    );

    // Exactly one should succeed (201), rest should fail (409)
    const statuses = results.map((r) => r.status);
    const successes = statuses.filter((s) => s === 201);
    const conflicts = statuses.filter((s) => s === 409);

    expect(successes).toHaveLength(1);
    expect(conflicts).toHaveLength(4);
  });
});

// Helper: spawn a worker thread and make HTTP request
async function spawnWorkerRequest(
  port: number,
  payload: object
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const workerScript = `
const { parentPort } = require('worker_threads');

parentPort.on('message', async (message) => {
  try {
    const { port, payload } = message;
    const response = await fetch(\`http://localhost:\${port}/appointment\`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'X-Role': 'clinician' 
      },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    parentPort.postMessage({ status: response.status, body });
  } catch (error) {
    parentPort.postMessage({ status: 0, body: { error: error.message } });
  }
});
    `;

    const worker = new Worker(workerScript, { eval: true });

    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error('Worker thread timeout'));
    }, 5000);

    worker.on('message', (message) => {
      clearTimeout(timeout);
      resolve(message);
      worker.terminate();
    });

    worker.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    worker.on('exit', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(`Worker exited with code ${code}`));
      }
    });

    // Send the request to the worker
    worker.postMessage({ port, payload });
  });
}
