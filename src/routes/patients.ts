import { Router, Request, Response, NextFunction } from 'express';
import { patientService } from '../services/patient';
import { CreatePatientSchema } from '../schemas/patient';

const router = Router();

router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = patientService.create(
      CreatePatientSchema.parse(req.body)
    );
    res.status(201).json(patient);
  } catch (err) {
    next(err);
  }
});

export default router;
