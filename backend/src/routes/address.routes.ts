import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/address.controller';

const router = Router();

// All address routes require authentication
router.use(authenticate);

router.get('/', getAddresses);
router.post('/', createAddress);
router.patch('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.patch('/:id/default', setDefaultAddress);

export const addressRoutes = router;

