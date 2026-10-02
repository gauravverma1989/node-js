const crypto = require('crypto');

const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;

exports.createEmailVerificationToken = () => {
    const token = crypto.randomBytes(32).toString('hex');
    return {
        token,
        tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
        expiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS)
    };
};

exports.hashEmailVerificationToken = token =>
    crypto.createHash('sha256').update(token).digest('hex');
