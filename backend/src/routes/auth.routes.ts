import { Router } from 'express';
import {
  register,
  login,
  getMe,
  logout,
  updateAddress,
  updateShopDetails,
  updateProfile,
  forgotPassword,
  verifyOtp,
  resetPassword,
} from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, updateProfile);
router.patch('/address', authenticate, updateAddress);
router.patch('/shop-details', authenticate, authorize('shop_owner', 'admin'), updateShopDetails);

export const authRoutes = router;
