Clinic Appointment System Backend
Coding Challenge (TypeScript)
Goal (timebox ~3–4 hours)
Build a small RESTful API in TypeScript that powers a simplified clinic appointment system.
The service should let patients book appointments, clinicians view their schedules, and
admins list upcoming appointments. Focus on correctness, code clarity, and reasonable
validation. You do not need to implement full auth, but design for roles
(patient/clinician/admin) and include a simple simulation (optional bonus).

What we expect from you
● Use TypeScript and a modern backend framework (Express, Fastify, Nest, or
similar).
● Persist data in-memory or with local DB (SQLite recommended).
● Validate inputs and handle edge-cases.
● Prevent overlapping appointments for the same clinician.
● Use meaningful HTTP status codes and sensible error messages.
● Organize code for readability and maintainability.
● Provide README with run + test instructions.

Required Endpoints
1. Create appointment POST /appointments Request body (JSON):
Behavior:
○ Validate start < end, datetimes are parseable, clinician & patient exist
(or auto-create simple records).
○ Reject if the requested time intersects any existing appointment for the
same clinicianId. Intersection means any overlap, even partial.
○ Return 201 Created with created appointment JSON on success.
○ Return 409 Conflict with message when overlap detected.
○ Return 400 Bad Request for invalid input.
2. List clinician’s upcoming appointments GET
/clinicians/{id}/appointments Query params (optional): from, to (ISO
date/time)

● Behavior:
○ Return list of appointments for clinician with start >= now (or respect
from/to if provided).
○ 200 OK with JSON array.
3. Admin: list all upcoming appointments GET /appointments Query params:
optional from, to (date range filtering)
● Behavior:
○ Return all upcoming appointments, filtered by date range if provided.
○ Support pagination or limit (optional).
○ 200 OK with JSON array.

Input validation rules (explicit)
● start and end must be valid ISO datetimes.
start must be strictly before end.
● Appointments of zero-length or negative-length are invalid.
● Overlaps include touching? — touching at endpoints is allowed: if end ==
other.start it's fine; if start < other.end && end > other.start
then it’s overlapping.
● Reject appointments in the past (optional but recommended).

Provide example curl commands in the README.

Deliverables
● Working TypeScript project with source code.
● README.md including:
○ How to run (npm/yarn), how to run with Docker (if provided).
○ Example requests (curl).
○ Design decisions / tradeoffs.
● Minimal tests (unit or integration) showing:
○ Creating an appointment,

○ Rejecting overlapping appointment,
○ Listing clinician appointments,
○ Date-range filtering.
● (Optional) Dockerfile for local run.

Bonus (optional, extra credit)
● Swagger / OpenAPI documentation (auto-generated via framework).
● Simple auth simulation: accept ?role=patient|clinician|admin query
param or X-Role header and enforce role-based access for endpoints (e.g., only
admin can call GET /appointments).
● Dockerfile + docker-compose with SQLite.
● CI script or GitHub Actions to run tests.
● Include concurrency-safe appointment creation (e.g., DB-level constraint or
application-level locking) and a note explaining how your solution handles race
conditions.

Short note for the candidate
● Timebox: aim for 3–4 hours. Focus on correctness and clarity over bells &
whistles. If you add extras, describe them in the README.
● Please include how to run your tests and a short paragraph describing any
trade-offs or limitations.