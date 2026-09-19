import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import PendingRegistration from '../models/PendingRegistration';
import PasswordReset from '../models/PasswordReset';
import { sendVerificationEmail, sendPasswordResetEmail, sendLoginLockoutOtpEmail } from '../services/emailService';

const hashOtp = (otp: string) => crypto.createHash('sha256').update(otp).digest('hex');
const createOtp = () => crypto.randomInt(100000, 1000000).toString();
const userResponse = (user: any) => ({ 
  _id: user._id, 
  name: user.name, 
  username: user.username, 
  email: user.email, 
  profileImage: user.profileImage, 
  gender: user.gender, 
  preferredGender: user.preferredGender, 
  isCollegeStudent: user.isCollegeStudent,
  institutionName: user.institutionName,
  preferredCommunity: user.preferredCommunity,
  role: user.role, 
  accountStatus: user.accountStatus 
});

const issueToken = (user: any) => jwt.sign(
  { userId: user._id, role: user.role }, 
  process.env.JWT_SECRET || 'fallback_secret', 
  { expiresIn: '7d' }
);

const isDemoEmail = (email: string): boolean => email.endsWith('@demo.com');

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const isCollegeStudent = Boolean(req.body.isCollegeStudent);
    const institutionName = String(req.body.institutionName || '').trim();
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
      res.status(400).json({ error: 'Enter your name, a valid email, and a password of at least 8 characters.' }); 
      return;
    }
    if (isCollegeStudent && !institutionName) {
      res.status(400).json({ error: 'Please enter your college or university name.' });
      return;
    }
    if (await User.exists({ email })) { 
      res.status(409).json({ error: 'An account already exists for this email. Please sign in.' }); 
      return; 
    }

    // ── Demo accounts (@demo.com) skip OTP entirely ──
    if (isDemoEmail(email)) {
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.create({ name, email, passwordHash, isCollegeStudent, institutionName: isCollegeStudent ? institutionName : undefined });
      res.status(201).json({ 
        token: issueToken(user), 
        user: userResponse(user), 
        demo: true,
        message: 'Demo account created instantly — no email verification required.' 
      });
      return;
    }

    const otp = createOtp();
    const passwordHash = await bcrypt.hash(password, 12);
    await PendingRegistration.findOneAndUpdate(
      { email },
      { name, email, passwordHash, isCollegeStudent, institutionName: isCollegeStudent ? institutionName : undefined, otpHash: hashOtp(otp), otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), otpAttempts: 0 },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    await sendVerificationEmail({ email, otp, name });
    res.status(202).json({ message: 'Verification code sent. It expires in 10 minutes.', email });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unable to start registration.' });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '');
    const pending = await PendingRegistration.findOne({ email });
    if (!pending || pending.otpExpiresAt < new Date()) { 
      res.status(400).json({ error: 'This verification code has expired. Please register again.' }); 
      return; 
    }
    if (pending.otpAttempts >= 5) { 
      await PendingRegistration.deleteOne({ _id: pending._id }); 
      res.status(429).json({ error: 'Too many verification attempts. Please register again.' }); 
      return; 
    }
    if (otp.length !== 6 || hashOtp(otp) !== pending.otpHash) { 
      pending.otpAttempts += 1; 
      await pending.save(); 
      res.status(400).json({ error: 'That verification code is incorrect.' }); 
      return; 
    }
    const user = await User.create({ name: pending.name, email: pending.email, passwordHash: pending.passwordHash, isCollegeStudent: pending.isCollegeStudent, institutionName: pending.institutionName });
    await PendingRegistration.deleteOne({ _id: pending._id });
    res.status(201).json({ token: issueToken(user), user: userResponse(user) });
  } catch (error: any) {
    if (error?.code === 11000) { 
      res.status(409).json({ error: 'An account already exists for this email. Please sign in.' }); 
      return; 
    }
    console.error('OTP verification error:', error); 
    res.status(500).json({ error: 'Unable to verify your code.' });
  }
};

export const emailSignIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email }).select('+passwordHash +loginAttempts +lockoutUntil');
    
    if (!user) {
      res.status(401).json({ error: 'Incorrect email or password.' }); 
      return; 
    }
    if (user.accountStatus !== 'ACTIVE') { 
      res.status(403).json({ error: 'This account is restricted.' }); 
      return; 
    }

    // Check if account is locked out
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / (1000 * 60));
      res.status(429).json({ error: `Account locked due to too many failed attempts. Try again in ${waitMinutes} minute(s).` });
      return;
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordCorrect) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      if (user.loginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes lockout
        await user.save();
        res.status(429).json({ error: 'Account locked due to too many failed attempts. Try again in 20 minutes.' });
        return;
      }
      
      await user.save();
      const attemptsLeft = 5 - user.loginAttempts;
      res.status(401).json({ error: `Incorrect email or password. ${attemptsLeft} attempt(s) remaining.` }); 
      return;
    }

    // Password is correct.
    // If they were previously locked out (loginAttempts >= 5), require OTP.
    if (user.loginAttempts >= 5) {
      const otp = createOtp();
      user.loginOtpHash = hashOtp(otp);
      user.loginOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes to enter OTP
      await user.save();
      
      await sendLoginLockoutOtpEmail({ email: user.email, otp, name: user.name });
      
      res.status(403).json({ requireOtp: true, message: 'Your account was locked. We sent a verification code to your email.' });
      return;
    }

    // Normal login
    user.loginAttempts = 0;
    user.lockoutUntil = undefined;
    user.loginOtpHash = undefined;
    user.loginOtpExpiresAt = undefined;
    
    user.lastLoginAt = new Date(); 
    user.lastActiveAt = new Date(); 
    await user.save();
    res.json({ token: issueToken(user), user: userResponse(user) });
  } catch (error) { 
    console.error('Email sign-in error:', error); 
    res.status(500).json({ error: 'Unable to sign in.' }); 
  }
};

export const verifyLoginOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();
    
    const user = await User.findOne({ email }).select('+loginOtpHash +loginOtpExpiresAt +loginAttempts');
    if (!user || user.accountStatus !== 'ACTIVE') {
      res.status(401).json({ error: 'Authentication failed.' });
      return;
    }

    if (!user.loginOtpHash || !user.loginOtpExpiresAt || user.loginOtpExpiresAt < new Date()) {
      res.status(400).json({ error: 'Verification code expired or not found. Please log in again.' });
      return;
    }

    if (hashOtp(otp) !== user.loginOtpHash) {
      res.status(400).json({ error: 'Incorrect verification code.' });
      return;
    }

    // OTP matches, issue token
    user.loginAttempts = 0;
    user.lockoutUntil = undefined;
    user.loginOtpHash = undefined;
    user.loginOtpExpiresAt = undefined;
    
    user.lastLoginAt = new Date(); 
    user.lastActiveAt = new Date(); 
    await user.save();
    
    res.status(200).json({ token: issueToken(user), user: userResponse(user) });
  } catch (error) {
    console.error('Verify login OTP error:', error);
    res.status(500).json({ error: 'Unable to verify login code.' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ error: 'No registered account found with this email address.' });
      return;
    }

    if (user.accountStatus !== 'ACTIVE') {
      res.status(403).json({ error: 'This account is suspended or restricted. Please contact support at logiterax@gmail.com.' });
      return;
    }

    const otp = createOtp();
    await PasswordReset.findOneAndUpdate(
      { email },
      {
        email,
        otpHash: hashOtp(otp),
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        otpAttempts: 0
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendPasswordResetEmail({ email, otp, name: user.name });
    res.status(200).json({ 
      message: 'A 6-digit password reset code has been sent to your email.', 
      email 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unable to process password reset request.' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();
    const newPassword = String(req.body.newPassword || '');

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({ error: 'Valid email address is required.' });
      return;
    }

    if (!otp || otp.length !== 6) {
      res.status(400).json({ error: 'Please enter the 6-digit verification code.' });
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      return;
    }

    const resetRecord = await PasswordReset.findOne({ email });
    if (!resetRecord || resetRecord.otpExpiresAt < new Date()) {
      res.status(400).json({ error: 'This verification code has expired. Please request a new code.' });
      return;
    }

    if (resetRecord.otpAttempts >= 5) {
      await PasswordReset.deleteOne({ _id: resetRecord._id });
      res.status(429).json({ error: 'Too many incorrect attempts. Please request a new verification code.' });
      return;
    }

    if (hashOtp(otp) !== resetRecord.otpHash) {
      resetRecord.otpAttempts += 1;
      await resetRecord.save();
      const remaining = 5 - resetRecord.otpAttempts;
      res.status(400).json({ 
        error: `Incorrect verification code.${remaining > 0 ? ` ${remaining} attempt(s) remaining.` : ''}` 
      });
      return;
    }

    // OTP matches! Update user password
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordHash = passwordHash;
    user.updatedAt = new Date();
    await user.save();

    // Clean up reset record
    await PasswordReset.deleteOne({ _id: resetRecord._id });

    res.status(200).json({ 
      success: true, 
      message: 'Password reset successfully! You can now sign in with your new password.' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unable to reset password.' });
  }
};
