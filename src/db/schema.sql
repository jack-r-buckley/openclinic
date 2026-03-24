PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clinician (
  id VARCHAR(36) PRIMARY KEY,
  firstName VARCHAR(100),
  lastName VARCHAR(100),
  role VARCHAR(50) CHECK(role IN ('clinician', 'admin'))
);

CREATE TABLE IF NOT EXISTS patient (
  id VARCHAR(36) PRIMARY KEY,
  firstName VARCHAR(100),
  lastName VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS appointment (
  id VARCHAR(36) PRIMARY KEY,
  clinicianId VARCHAR(36) NOT NULL,
  patientId VARCHAR(36) NOT NULL,
  start INTEGER NOT NULL,
  end INTEGER NOT NULL,
  CHECK (start < end),

  FOREIGN KEY (clinicianId) REFERENCES clinician(id),
  FOREIGN KEY (patientId) REFERENCES patient(id)
);

CREATE INDEX IF NOT EXISTS idx_appointment_clinician_time
ON appointment (clinicianId, start, end);