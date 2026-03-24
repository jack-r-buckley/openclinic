# OpenClinic

## Background
OpenClinic is a simple, RESTful clinical booking service created as an example project for a job interview process. 

## Fast setup
1. `git clone git@github.com:jack-r-buckley/openclinic.git` 
2. `npm install`
3. `npm test`
4. `npm run dev`

## Docker
Run the app in a container:
```bash
docker-compose up
```
This starts the server on `http://localhost:3000` with hot-reload enabled for development.

Alternatively, build and run manually:
```bash
docker build -t openclinic .
docker run -p 3000:3000 openclinic
```

## CI
Tests run automatically on push and PRs to `main` and `develop` branches via GitHub Actions. See `.github/workflows/test.yml`.

## API
### Authentication
All endpoints require the `X-Role` header with one of: `admin`, `clinician`, `patient`
```bash
-H  "X-Role: admin"
```

  
### Appointments
#### Create Appointment

```bash
curl -X POST http://localhost:3000/appointment \
  -H "X-Role: clinician" \
  -H "Content-Type: application/json" \
  -d '{
    "clinicianId": "123e4567-e89b-12d3-a456-426614174000",
    "patientEmail": "john@example.com",
    "start": "2024-12-15T10:00:00Z",
    "end": "2024-12-15T11:00:00Z"
  }'
```
**Success Response (201):**
```json
{
"id": "550e8400-e29b-41d4-a716-446655440000",
"clinicianId": "123e4567-e89b-12d3-a456-426614174000",
"patientId": "550e8400-e29b-41d4-a716-446655440001",
"start": "2024-12-15T10:00:00Z",
"end": "2024-12-15T11:00:00Z",
}
```
**Error Responses:**

-  `400` - Request does not pass validation
-  `403` - Insufficient role permissions to make this request
-  `404` - Clinician not found
-  `409` - Appointment overlaps with existing appointment for this clinician

#### List All Appointments (Admin Only)

```bash
curl -X GET http://localhost:3000/appointment \
  -H "X-Role: admin"
```

**Success Response (200):**

```json
[{
"id": "550e8400-e29b-41d4-a716-446655440000",
"clinicianId": "123e4567-e89b-12d3-a456-426614174000",
"patientId": "550e8400-e29b-41d4-a716-446655440001",
"start": "2024-12-15T10:00:00Z",
"end": "2024-12-15T11:00:00Z",
}]
```
**Error Responses:**
-  `403` - Forbidden (only admin can list all appointments)

#### List Appointments for a Clinician
```bash
curl -X GET "http://localhost:3000/appointment/clinician/123e4567-e89b-12d3-a456-426614174000" \
  -H "X-Role: clinician"

# Optional: filter by date range
curl -X GET "http://localhost:3000/appointment/clinician/123e4567-e89b-12d3-a456-426614174000?start=2024-12-01T00:00:00Z&end=2024-12-31T23:59:59Z" \
  -H "X-Role: clinician"
```
**Success Response (200):**
```json
[{
"id": "550e8400-e29b-41d4-a716-446655440000",
"clinicianId": "123e4567-e89b-12d3-a456-426614174000",
"patientId": "550e8400-e29b-41d4-a716-446655440001",
"start": "2024-12-15T10:00:00Z",
"end": "2024-12-15T11:00:00Z",
}]
```

### Patients
#### Create Patient
```bash
curl -X POST http://localhost:3000/patient \
  -H "X-Role: clinician" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "dateOfBirth": "1990-05-15"
  }'
```

**Success Response (201):**

```json
{
"id": "550e8400-e29b-41d4-a716-446655440001",
"email": "jane@example.com",
"firstName": "Jane",
"lastName": "Doe",
"dateOfBirth": "1990-05-15"
}

```

### Clinicians
#### Create Clinician
```bash
curl -X POST http://localhost:3000/clinician \
  -H "X-Role: admin" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Sandra",
    "lastName": "Practitioner",
    "role": "doctor"
  }'
```
**Success Response (201):**
```json
{
"id": "123e4567-e89b-12d3-a456-426614174000",
"firstName":  "Sandra",
"lastName":  "Practitioner",
"role":  "doctor"
}

```

## Testing
Run all tests with `npm test`. Coverage includes:
- **Validation**: Input validation and error handling
- **Business Logic**: Overlap detection, past appointment rejection, patient auto-creation
- **Authorization**: Role-based access control
- **Concurrency**: Race condition prevention using Worker threads (tests genuine OS-level concurrency)
- **Integration**: Full end-to-end appointment flows



## Project Setup
#### TSconfig
The following changes were made from the default file.
```json
{
  "module": "CommonJS",
  "target": "ES2020",
  "types": ["node"]
}
```
* **CommonJS** - es modules are not required in this small project, so we're using a simpler alternative
* **ES2020** - latest js features are not required, going for a stable baseline

## Packages
**better-sqlite3**
This is the best currently available package for implementing sqlite in Node. It provides a synchronous API that simplifies the control flow for DB operations. When combined with transactions and DB-level write-locks, this will make it easy for us to handle concurrency and prevent race conditions.

**zod**
Provides runtime validation and type definitions. I like to use a package like zod because TS types don't exist at runtime, so they cannot provide protection against invalid external inputs (e.g. malformed or mistyped HTTP requests). Zod gives us a single source of truth for types at all levels (API, application, DB), automatically derives TS types, and even helps us enforce business logic through validation rules on fields (e.g. start and end times).

**express**
I have more personal experience with Express, so I chose this over Fastify. Nest and most other choices are too feature-rich and heavy for a small project like this. Fastify would also be a great choice.

**vitest and supertest**
Provide unit and integration tests. Supertest allows making HTTP requests to my endpoints without running the server, which keeps things simple. I used vitest instead of jest because it's a lot faster and I don't need any of the more advances Jest features (mocking, snapshots).

## Discussion
An appointment booking system operates on an **at most once** principle. A duplicated request should not result in multiple bookings, e.g. from network errors, client app allowing double clicks.

In addition, the validation rules require DB checks before inserting appointments, creating a race window (multiple concurrent requests going for the same time slot).

 This implementation solves both of these problems using **database level write locking** with **transactions**. This is a common pattern for SQLite, enforced through the `BEGIN IMMEDIATE` syntax which acquires a write lock at the beginning of the transaction. In a single-instance project like this, enforcing correctness at the write boundary is simple and correct.

### Tradeoffs
* **DB level concurrency control** - simple and effective for this use case, but won't allow for horiztonal scaling. If this application becomes distributed, this will need to be rewritten at the application level.
* **Implicit patient creation** - the appointment creation endpoint enforces an existing clinician, but will autocreate patients. I made this decision because there will be few clinicians, and it is their schedule that is important, whereas they will see many patients. However the implementation assumes email addresses are a unique and stable identifier and may lead to duplicate patients if email formats vary.
* **ISO / Unix ms conversion** - I converted ISO dates from the requests into UNIX timestamps in the application/DB layers to avoid timezone confusion and make comparisons efficient. However, this forces the client to manage timezones themselves.
* **Singular resource names** - e.g `/patient` instead of `/patients` Just a personal quirk really. It avoids pluralisation issues e.g. `/persons` or /`people` ?