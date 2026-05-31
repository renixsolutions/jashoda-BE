const nodemailer = require('nodemailer');
const logger = require('./logger');
const appConfig = require('../config/app');

// Create a transporter instance
let transporter;

const initializeTransporter = async () => {
    if (transporter) return transporter;

    // Use SMTP credentials from environment if available
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        logger.info('SMTP transporter initialized with provided credentials.');
    } else {
        // Fallback to Ethereal Email for development/testing
        logger.warn('No SMTP credentials found in .env. Falling back to Ethereal Email for testing.');
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        logger.info(`Ethereal test account created: ${testAccount.user}`);
    }

    return transporter;
};

/**
 * Send an email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body (optional)
 * @returns {Promise<any>}
 */
const sendEmail = async (to, subject, text, html = '') => {
    try {
        const mailTransporter = await initializeTransporter();
        
        const info = await mailTransporter.sendMail({
            from: `"Jashoda Jewellers" <${process.env.SMTP_USER || 'no-reply@jashodajewellers.com'}>`,
            to,
            subject,
            text,
            html: html || text,
        });

        logger.info(`Email sent to ${to}. MessageId: ${info.messageId}`);
        
        // If using Ethereal, log the preview URL
        if (info.messageId && mailTransporter.options.host === 'smtp.ethereal.email') {
            logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }

        return info;
    } catch (error) {
        logger.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};

module.exports = {
    sendEmail,
};
