const nodemailer = require('nodemailer');

const requiredSettings = [
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_FROM'
];

const assertEmailConfigured = () => {
    const missing = requiredSettings.filter(key => !process.env[key]);
    if (missing.length) {
        throw new Error(`Email delivery is not configured. Missing: ${missing.join(', ')}`);
    }
};

const createTransporter = () => {
    assertEmailConfigured();
    const port = Number(process.env.SMTP_PORT || 587);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('SMTP_PORT must be a valid port number');
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: process.env.SMTP_SECURE === 'true' || port === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

const escapeHtml = value => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

exports.assertEmailConfigured = assertEmailConfigured;

exports.sendVerificationEmail = async ({ email, name, token }) => {
    const transporter = createTransporter();
    const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:4200';
    const verificationUrl = new URL('/verify-email', frontendBaseUrl);
    verificationUrl.searchParams.set('token', token);
    const safeName = escapeHtml(name || 'there');

    await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Verify your profile email',
        text: `Hello ${name || 'there'},\n\nYour profile has been created. Verify your email within 24 hours by opening this link:\n${verificationUrl.toString()}\n\nIf you did not expect this email, you can ignore it.`,
        html: `<p>Hello ${safeName},</p><p>Your profile has been created. Verify your email within 24 hours:</p><p><a href="${verificationUrl.toString()}">Verify email address</a></p><p>If you did not expect this email, you can ignore it.</p>`
    });
};
