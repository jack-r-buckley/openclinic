import { Router, Request, Response, NextFunction } from 'express';
import { appointmentService } from '../services/appointment';
import { CreateAppointmentRequestSchema, DateRangeQuerySchema } from '../schemas/request';
import { IdSchema } from '../schemas/common';
import { isoToMs } from '../utils/time';

const router = Router();

router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = appointmentService.createAppointment(
      CreateAppointmentRequestSchema.parse(req.body)
    );
    res.status(201).json(appointment);
  } catch (err) {
    next(err);
  }
});

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        error: 'Unauthorized: Only admins can list all appointments',
      });
    }

    const query = DateRangeQuerySchema.parse({
      from: typeof req.query.from === 'string' ? req.query.from : undefined,
      to: typeof req.query.to === 'string' ? req.query.to : undefined,
    });

    const appointments = appointmentService.listAll(
      query.from ? isoToMs(query.from) : undefined,
      query.to ? isoToMs(query.to) : undefined
    );

    res.status(200).json(appointments);
  } catch (err) {
    next(err);
  }
});

router.get('/clinicians/:id/appointments', (req: Request, res: Response, next: NextFunction) => {
  try {
    const clinicianId = IdSchema.parse(req.params.id) as string;

    const query = DateRangeQuerySchema.parse({
      from: typeof req.query.from === 'string' ? req.query.from : undefined,
      to: typeof req.query.to === 'string' ? req.query.to : undefined,
    });

    const appointments = appointmentService.listByClinician(
      clinicianId,
      query.from ? isoToMs(query.from) : undefined,
      query.to ? isoToMs(query.to) : undefined
    );

    res.status(200).json(appointments);
  } catch (err) {
    next(err);
  }
});

export default router;
