const jwt = require('jsonwebtoken');
const Profile = require('../modules/profile/profile.model');
const Role = require('../modules/roles/role.model');
const sendResponse = require('../utils/response');

module.exports = async (req, res, next) => {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return sendResponse(res, 401, 'Authentication required', null);
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        return sendResponse(res, 500, 'Authentication is not configured', null);
    }

    let claims;
    try {
        claims = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256']
        });
    } catch (error) {
        return sendResponse(res, 401, 'Invalid or expired access token', null);
    }

    try {
        const profile = await Profile.findOne({ id: Number(claims.sub) }).select('id name email role emailVerifiedAt');

        if (!profile) {
            return sendResponse(res, 401, 'Account no longer exists', null);
        }

        if (!profile.emailVerifiedAt) {
            return sendResponse(res, 401, 'Email verification is required', null);
        }

        const role = await Role.findOne({ id: profile.role, isActive: true }).select('name');

        if (!role) {
            return sendResponse(res, 403, 'Account role is inactive', null);
        }

        req.auth = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: role.name
        };

        return next();
    } catch (error) {
        return next(error);
    }
};
