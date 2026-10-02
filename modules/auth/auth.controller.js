const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Profile = require('../profile/profile.model');
const Role = require('../roles/role.model');
const sendResponse = require('../../utils/response');
const emailService = require('../../utils/email');
const {
    createEmailVerificationToken,
    hashEmailVerificationToken
} = require('../../utils/emailVerification');

const ACCESS_TOKEN_LIFETIME = '30d';
const ACCESS_TOKEN_SECONDS = 30 * 24 * 60 * 60;

exports.login = async (req, res, next) => {
    try {
        const email = typeof req.body.email === 'string'
            ? req.body.email.trim().toLowerCase()
            : '';
        const password = typeof req.body.password === 'string'
            ? req.body.password
            : '';

        if (!email || !password) {
            return sendResponse(res, 400, 'Email and password are required', null);
        }

        const profile = await Profile.findOne({ email }).select('+passwordHash');

        if (!profile || !profile.passwordHash || !(await bcrypt.compare(password, profile.passwordHash))) {
            return sendResponse(res, 401, 'Invalid email or password', null);
        }

        if (!profile.emailVerifiedAt) {
            return sendResponse(res, 403, 'Email address is not verified. Resend the verification email to continue.', null);
        }

        const role = await Role.findOne({ id: profile.role, isActive: true });

        if (!role) {
            return sendResponse(res, 403, 'Account role is inactive', null);
        }

        if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
            return next(new Error('JWT_SECRET must be configured with at least 32 characters'));
        }

        const accessToken = jwt.sign(
            { role: role.name },
            process.env.JWT_SECRET,
            {
                algorithm: 'HS256',
                subject: String(profile.id),
                expiresIn: ACCESS_TOKEN_LIFETIME
            }
        );

        return sendResponse(res, 200, 'Login successful', {
            accessToken,
            expiresIn: ACCESS_TOKEN_SECONDS,
            user: {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                role: role.name
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.verifyEmail = async (req, res, next) => {
    try {
        const token = typeof req.body?.token === 'string' ? req.body.token : '';
        if (!/^[a-f0-9]{64}$/i.test(token)) {
            return sendResponse(res, 400, 'Verification link is invalid or expired', null);
        }

        const now = new Date();
        const profile = await Profile.findOneAndUpdate(
            {
                emailVerificationTokenHash: hashEmailVerificationToken(token),
                emailVerificationExpiresAt: { $gt: now },
                emailVerifiedAt: null
            },
            {
                $set: { emailVerifiedAt: now },
                $unset: {
                    emailVerificationTokenHash: 1,
                    emailVerificationExpiresAt: 1
                }
            },
            { new: true }
        ).select('id email emailVerifiedAt');

        if (!profile) {
            return sendResponse(res, 400, 'Verification link is invalid, expired, or already used', null);
        }

        return sendResponse(res, 200, 'Email verified successfully. You can now sign in.', {
            email: profile.email,
            emailVerifiedAt: profile.emailVerifiedAt
        });
    } catch (error) {
        next(error);
    }
};

exports.resendVerification = async (req, res, next) => {
    try {
        const email = typeof req.body?.email === 'string'
            ? req.body.email.trim().toLowerCase()
            : '';
        if (!email) {
            return sendResponse(res, 400, 'Email is required', null);
        }

        try {
            emailService.assertEmailConfigured();
        } catch (error) {
            return sendResponse(res, 503, 'Email delivery is not configured on the server', null);
        }

        const profile = await Profile.findOne({ email });
        if (!profile || profile.emailVerifiedAt) {
            return sendResponse(res, 200, 'If the account exists and needs verification, a link will be sent.', null);
        }

        const verification = createEmailVerificationToken();
        profile.emailVerificationTokenHash = verification.tokenHash;
        profile.emailVerificationExpiresAt = verification.expiresAt;
        await profile.save();

        try {
            await emailService.sendVerificationEmail({
                email: profile.email,
                name: profile.name,
                token: verification.token
            });
        } catch (error) {
            console.error('Verification email delivery failed:', error.message);
            return sendResponse(res, 503, 'Unable to send the verification email. Please try again later.', null);
        }

        return sendResponse(res, 200, 'If the account exists and needs verification, a link will be sent.', null);
    } catch (error) {
        next(error);
    }
};
