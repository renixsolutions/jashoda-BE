const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const UserModel = require('../users/user.model');
const appConfig = require('../../config/app');
const logger = require('../../utils/logger');
const { generateToken, verifyToken } = require('../../utils/jwt');
const { sendVerificationEmail, sendOtpEmail, STATIC_OTP } = require('../../services/email.service');

const TEMP_TOKEN_EXPIRY = '15m';
const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;

const otpCache = new Map(); // In-memory store for OTPs

class AuthService {
  static async login(email, password) {
    const UserService = require('../users/user.service');
    return UserService.login(email, password);
  }

  /**
   * Request OTP for email
   */
  static async requestOtp(email) {
    const emailTrimmed = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      throw new Error('Invalid email address');
    }
    
    // Generate unique 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    otpCache.set(emailTrimmed, {
      otp,
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    await sendOtpEmail(emailTrimmed, otp);
    return { message: 'OTP sent successfully to your email' };
  }

  /**
   * Verify OTP: if valid, return registered user + token or tempToken for registration
   */
  static async verifyOtp(email, otp) {
    const emailTrimmed = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      throw new Error('Invalid email address');
    }
    
    const cached = otpCache.get(emailTrimmed);
    if (!cached) {
      throw new Error('Invalid or expired OTP');
    }
    if (Date.now() > cached.expires) {
      otpCache.delete(emailTrimmed);
      throw new Error('OTP has expired');
    }
    if (cached.otp !== String(otp).trim()) {
      throw new Error('Invalid OTP');
    }
    
    // Clear OTP after successful use
    otpCache.delete(emailTrimmed);

    const user = await UserModel.findByEmail(emailTrimmed);
    if (user) {
      if (user.status !== 'active') {
        throw new Error('Account is not active');
      }
      const token = generateToken({
        id: user.id,
        email: user.email,
        username: user.username,
        phone: user.phone
      });
      delete user.password;
      return {
        registered: true,
        token,
        user: {
          ...user,
          email_verified: user.email_verified === true
        }
      };
    }
    const tempToken = generateToken(
      { email: emailTrimmed, purpose: 'complete_registration' },
      TEMP_TOKEN_EXPIRY
    );
    return {
      registered: false,
      tempToken,
      email: emailTrimmed
    };
  }

  /**
   * Complete registration after OTP: create user, send verification email, return token
   */
  static async completeRegistration(tempToken, { title, fullName, email }) {
    let decoded;
    try {
      decoded = verifyToken(tempToken);
    } catch (e) {
      throw new Error('Invalid or expired link. Please request OTP again.');
    }
    if (decoded.purpose !== 'complete_registration' || !decoded.email) {
      throw new Error('Invalid token');
    }
    // Trust the email from the token, ignore the one passed in body (or enforce they match)
    const emailTrimmed = decoded.email;
    const name = String(fullName || '').trim();
    if (!name) {
      throw new Error('Full name is required');
    }
    
    // Check if email somehow got registered in the meantime
    const existingByEmail = await UserModel.findByEmail(emailTrimmed);
    if (existingByEmail) {
      throw new Error('Email already registered');
    }
    const parts = name.split(/\s+/).filter(Boolean);
    const first_name = parts[0] || name;
    const last_name = parts.slice(1).join(' ') || parts[0] || name;
    const username = emailTrimmed.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_') +
      '_' + Math.random().toString(36).slice(2, 6);
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, appConfig.bcrypt.saltRounds);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);

    const user = await UserModel.create({
      name,
      first_name,
      last_name,
      email: emailTrimmed,
      username,
      password: hashedPassword,
      phone: null,
      title: title || null,
      email_verified: false,
      email_verification_token: verificationToken,
      email_verification_expires_at: expiresAt,
      status: 'active'
    });

    try {
      await sendVerificationEmail(emailTrimmed, name, verificationToken);
    } catch (err) {
      logger.error('Send verification email failed:', err);
      // Still allow registration; user can request resend later
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      phone: user.phone
    });
    delete user.password;
    return {
      token,
      user: {
        ...user,
        email_verified: false
      }
    };
  }

  /**
   * Verify email via token from link; redirect to frontend
   */
  static async verifyEmail(token) {
    const user = await UserModel.findByEmailVerificationToken(token);
    if (!user) {
      throw new Error('Invalid or expired verification link');
    }
    await UserModel.setEmailVerified(user.id);
    return user;
  }

  /**
   * Resend verification email
   */
  static async resendEmailVerification(userId) {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error('User not found');
    if (user.email_verified) throw new Error('Email is already verified');

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);

    await UserModel.update(userId, {
      email_verification_token: verificationToken,
      email_verification_expires_at: expiresAt
    });

    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (err) {
      logger.error('Resend verification email failed:', err);
      throw new Error('Failed to send verification email. Please try again later.');
    }

    return { message: 'Verification email sent successfully' };
  }
}

module.exports = AuthService;