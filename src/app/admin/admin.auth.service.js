const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const UserModel = require('../users/user.model');
const appConfig = require('../../config/app');
const logger = require('../../utils/logger');
const { generateToken, verifyToken } = require('../../utils/jwt');
const {
  sendAdminTwoFaCode,
  sendAdminPasswordResetEmail,
} = require('../../services/email.service');

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'STAFF'];
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const MAX_2FA_ATTEMPTS = 5;

class AdminAuthService {
  /**
   * Check if a user has an admin role
   */
  static isAdmin(user) {
    return ADMIN_ROLES.includes(user.role);
  }

  /**
   * Generate a secure 6-digit OTP, store its bcrypt hash, and email it.
   * Returns the challenge token (short-lived JWT with userId + purpose).
   */
  static async initiate2FA(user) {
    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await UserModel.setTwoFaCode(user.id, otpHash, expiresAt);

    // Send OTP email
    try {
      await sendAdminTwoFaCode(user.email, otp);
    } catch (err) {
      logger.error('Failed to send admin 2FA OTP email:', err);
      throw new Error('Failed to send verification code. Please try again.');
    }

    // Issue a short-lived challenge token (does NOT grant access)
    const challengeToken = generateToken(
      { userId: user.id, purpose: '2fa_challenge' },
      '10m'
    );

    return { requires2FA: true, challengeToken };
  }

  /**
   * Verify an OTP submitted with a challenge token.
   * On success, returns a full access JWT.
   */
  static async verify2FA(challengeToken, otp) {
    // Validate challenge token
    let decoded;
    try {
      decoded = verifyToken(challengeToken);
    } catch {
      throw new Error('Invalid or expired session. Please log in again.');
    }
    if (decoded.purpose !== '2fa_challenge' || !decoded.userId) {
      throw new Error('Invalid challenge token.');
    }

    const user = await UserModel.findById(decoded.userId);
    if (!user || !AdminAuthService.isAdmin(user)) {
      throw new Error('Unauthorized.');
    }

    // Check OTP data exists and hasn't expired
    if (!user.two_fa_code_hash || !user.two_fa_expires_at) {
      throw new Error('No pending verification. Please log in again.');
    }
    if (new Date() > new Date(user.two_fa_expires_at)) {
      await UserModel.clearTwoFaCode(user.id);
      throw new Error('Verification code has expired. Please log in again.');
    }

    // Check attempt count
    if (user.two_fa_attempts >= MAX_2FA_ATTEMPTS) {
      await UserModel.clearTwoFaCode(user.id);
      throw new Error('Too many failed attempts. Please log in again.');
    }

    // Verify OTP
    const isValid = await bcrypt.compare(String(otp).trim(), user.two_fa_code_hash);
    if (!isValid) {
      await UserModel.incrementTwoFaAttempts(user.id);
      const remaining = MAX_2FA_ATTEMPTS - (user.two_fa_attempts + 1);
      if (remaining <= 0) {
        await UserModel.clearTwoFaCode(user.id);
        throw new Error('Too many failed attempts. Please log in again.');
      }
      throw new Error(`Invalid verification code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
    }

    // Valid — clear OTP and issue full access token
    await UserModel.clearTwoFaCode(user.id);

    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      pwdAt: user.password_changed_at ? new Date(user.password_changed_at).getTime() : null,
    });

    delete user.password;
    return { token, user };
  }

  /**
   * Forgot password — generate reset token, email link.
   * Always returns a generic message (prevents email enumeration).
   */
  static async forgotPassword(email) {
    const genericMessage = 'If the account exists, a reset link has been sent.';

    const user = await UserModel.findByEmail(email.toLowerCase().trim());
    if (!user || !AdminAuthService.isAdmin(user)) {
      // Return generic message even if not found
      return { message: genericMessage };
    }

    // Generate cryptographically random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_EXPIRY_MS);

    await UserModel.setResetToken(user.id, tokenHash, expiresAt);

    const resetUrl = `${appConfig.appUrl}/admin/reset-password?token=${rawToken}`;

    try {
      await sendAdminPasswordResetEmail(user.email, user.name || user.username, resetUrl);
    } catch (err) {
      logger.error('Failed to send password reset email:', err);
      // Still return generic message
    }

    return { message: genericMessage };
  }

  /**
   * Reset password using a valid reset token.
   * Invalidates all existing sessions after success.
   */
  static async resetPassword(rawToken, newPassword) {
    if (!newPassword || newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const user = await UserModel.findByResetToken(tokenHash);

    if (!user) {
      throw new Error('Invalid or expired reset link. Please request a new one.');
    }
    if (!AdminAuthService.isAdmin(user)) {
      throw new Error('Unauthorized.');
    }
    if (new Date() > new Date(user.reset_password_expires_at)) {
      throw new Error('Reset link has expired. Please request a new one.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, appConfig.bcrypt.saltRounds);
    const now = new Date();

    await UserModel.update(user.id, {
      password: hashedPassword,
      reset_password_token_hash: null,
      reset_password_expires_at: null,
      // password_changed_at invalidates all existing JWTs issued before this time
      password_changed_at: now,
      // Also clear any pending 2FA
      two_fa_code_hash: null,
      two_fa_expires_at: null,
      two_fa_attempts: 0,
    });

    return { message: 'Password reset successfully. Please log in with your new password.' };
  }
}

module.exports = AdminAuthService;
module.exports.ADMIN_ROLES = ADMIN_ROLES;
