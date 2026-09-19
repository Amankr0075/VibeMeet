import { Router } from 'express';
import { emailSignIn, register, verifyOtp, forgotPassword, resetPassword, verifyLoginOtp } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', emailSignIn);
router.post('/verify-login-otp', verifyLoginOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
