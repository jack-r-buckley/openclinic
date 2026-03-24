import { Router, Request, Response, NextFunction } from 'express';
import { clinicianService } from '../services/clinician';
import { CreateClinicianSchema } from '../schemas/clinical';

const router = Router();

router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const clinician = clinicianService.create(
      CreateClinicianSchema.parse(req.body)
    );
    res.status(201).json(clinician);
  } catch (err) {
    next(err);
  }
});

export default router;
