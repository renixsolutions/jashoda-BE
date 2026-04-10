const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const UserModel = require('../users/user.model');
const appConfig = require('../../config/app');
const logger = require('../../utils/logger');
const { generateToken, verifyToken } = require('../../utils/jwt');
const { sendVerificationEmail, STATIC_OTP } = require('../../services/email.service');

const TEMP_TOKEN_EXPIRY = '15m';
const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;

class AuthService {
  static async login(email, password) {
    const UserService = require('../users/user.service');
    return UserService.login(email, password);
  }

  /**
   * Request OTP for phone (static OTP 123456 for now)
   */
  static async requestOtp(phone) {
    const normalized = String(phone).replace(/\D/g, '');
    if (normalized.length < 10) {
      throw new Error('Invalid phone number');
    }
    // In production you would send SMS here. For now we just return success.
    return { message: 'OTP sent successfully' };
  }

  /**
   * Verify OTP: if valid (123456), return registered user + token or tempToken for registration
   */
  static async verifyOtp(phone, otp) {
    const normalized = String(phone).replace(/\D/g, '');
    if (normalized.length < 10) {
      throw new Error('Invalid phone number');
    }
    if (String(otp).trim() !== STATIC_OTP) {
      throw new Error('Invalid OTP');
    }
    const user = await UserModel.findByPhone(normalized);
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
      { phone: normalized, purpose: 'complete_registration' },
      TEMP_TOKEN_EXPIRY
    );
    return {
      registered: false,
      tempToken,
      phone: normalized
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
    if (decoded.purpose !== 'complete_registration' || !decoded.phone) {
      throw new Error('Invalid token');
    }
    const phone = decoded.phone;
    const name = String(fullName || '').trim();
    const emailTrimmed = String(email || '').trim().toLowerCase();
    if (!name || !emailTrimmed) {
      throw new Error('Full name and email are required');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      throw new Error('Invalid email format');
    }
    const existingByPhone = await UserModel.findByPhone(phone);
    if (existingByPhone) {
      throw new Error('Phone number already registered');
    }
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
      phone,
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