import express, { Express, Request, Response, NextFunction } from 'express';
import appointmentRoutes from './routes/appointments';
import patientRoutes from './routes/patients';
import clinicianRoutes from './routes/clinicians';
import { AppointmentValidationError, AppointmentConflictError, ClinicianNotFoundError } from './utils/errors';
import { z } from 'zod';

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

export type UserRole = 'patient' | 'clinician' | 'admin';

declare global {
  namespace Express {
    interface Request {
      userRole?: UserRole;
    }
  }
}

app.use((req: Request, res: Response, next: NextFunction) => {
  const roleValue = req.get('X-Role');

  if (roleValue) {
    const validRoles = ['patient', 'clinician', 'admin'];
    if (validRoles.includes(roleValue)) {
      req.userRole = roleValue as UserRole;
    }
  }

  next();
});

app.use('/appointments', appointmentRoutes);
app.use('/patients', patientRoutes);
app.use('/clinicians', clinicianRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Invalid request body',
      details: err.issues,
    });
  }

  if (err instanceof AppointmentValidationError) {
    return res.status(400).json({
      error: err.message,
    });
  }

  if (err instanceof AppointmentConflictError) {
    return res.status(409).json({
      error: err.message,
    });
  }

  if (err instanceof ClinicianNotFoundError) {
    return res.status(404).json({
      error: err.message,
    });
  }

  res.status(500).json({
    error: 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
