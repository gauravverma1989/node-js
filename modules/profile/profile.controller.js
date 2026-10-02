const Profile = require('./profile.model');
const bcrypt = require('bcryptjs');
const sendResponse = require('../../utils/response');
const getNextSequence = require('../../utils/counter');
const Role = require('../roles/role.model');
const emailService = require('../../utils/email');
const { createEmailVerificationToken } = require('../../utils/emailVerification');
// Create User
exports.createUser = async (req, res, next) => {
    try {
        const {
            name,
            email,
            age,
            designation,
            role,
            password
        } = req.body || {};

        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return sendResponse(res, 400, 'A valid email address is required', null);
        }

        if (
            typeof password !== 'string' ||
            password.length < 12 ||
            Buffer.byteLength(password, 'utf8') > 72
        ) {
            return sendResponse(
                res,
                400,
                'Password must be at least 12 characters and no more than 72 bytes',
                null
            );
        }

        try {
            emailService.assertEmailConfigured();
        } catch (error) {
            return sendResponse(res, 503, 'Email delivery is not configured on the server', null);
        }

        // Check if email already exists
        const existingUser = await Profile.findOne({ email: normalizedEmail });

        if (existingUser) {
            return sendResponse(
                res,
                409,
                'User with this email already exists',
                null
            );
        }

        // Validate role using custom Role.id
        const roleData = await Role.findOne({
            id: role,
            isActive: true
        });

        if (!roleData) {
            return sendResponse(
                res,
                400,
                'Invalid or inactive role',
                null
            );
        }

        // Generate custom Profile ID
        const profileId = await getNextSequence('profile');
        const passwordHash = await bcrypt.hash(password, 12);
        const verification = createEmailVerificationToken();

        const profile = await Profile.create({
            id: profileId,
            name,
            email: normalizedEmail,
            age,
            designation,
            role: roleData.id,
            passwordHash,
            emailVerifiedAt: null,
            emailVerificationTokenHash: verification.tokenHash,
            emailVerificationExpiresAt: verification.expiresAt
        });

        const safeProfile = profile.toObject();
        delete safeProfile.passwordHash;
        delete safeProfile.emailVerificationTokenHash;
        delete safeProfile.emailVerificationExpiresAt;

        let emailVerificationSent = true;
        try {
            await emailService.sendVerificationEmail({
                email: profile.email,
                name: profile.name,
                token: verification.token
            });
        } catch (error) {
            emailVerificationSent = false;
            console.error('Verification email delivery failed:', error.message);
        }

        return sendResponse(
            res,
            201,
            emailVerificationSent
                ? 'Profile created. A verification email has been sent.'
                : 'Profile created, but the verification email could not be sent. Resend it from the profile list.',
            safeProfile,
            undefined,
            { emailVerificationSent }
        );

    } catch (error) {
        next(error);
    }
};


// Update User
exports.updateUser = async (req, res, next) => {
    try {
        const userId = Number(req.query.id || req.params.id);

        const {
            name,
            email,
            age,
            designation,
            role,
            password
        } = req.body || {};

        // Find user using custom Profile.id
        const user = await Profile.findOne({
            id: userId
        });

        if (!user) {
            return sendResponse(
                res,
                404,
                'User not found',
                null
            );
        }

        if (password !== undefined && (
            typeof password !== 'string' ||
            password.length < 12 ||
            Buffer.byteLength(password, 'utf8') > 72
        )) {
            return sendResponse(
                res,
                400,
                'New password must be at least 12 characters and no more than 72 bytes',
                null
            );
        }

        if (email !== undefined && (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) {
            return sendResponse(res, 400, 'A valid email address is required', null);
        }

        const normalizedEmail = email === undefined ? user.email : email.trim().toLowerCase();
        const emailChanged = normalizedEmail !== user.email;

        if (emailChanged) {
            try {
                emailService.assertEmailConfigured();
            } catch (error) {
                return sendResponse(res, 503, 'Email delivery is not configured on the server', null);
            }
        }

        // If email is being changed, check duplicate
        if (emailChanged) {
            const existingUser = await Profile.findOne({
                email: normalizedEmail,
                id: { $ne: userId }
            });

            if (existingUser) {
                return sendResponse(
                    res,
                    409,
                    'Email already exists',
                    null
                );
            }
        }

        // Validate role if provided
        let roleId = user.role;

        if (role !== undefined && role !== null) {

            const roleData = await Role.findOne({
                id: role,
                isActive: true
            });

            if (!roleData) {
                return sendResponse(
                    res,
                    400,
                    'Invalid or inactive role',
                    null
                );
            }

            if (user.role !== roleData.id) {
                const currentRole = await Role.findOne({ id: user.role }).select('name');
                if (
                    currentRole?.name === 'ADMIN' &&
                    roleData.name !== 'ADMIN' &&
                    await Profile.countDocuments({ role: user.role }) <= 1
                ) {
                    return sendResponse(
                        res,
                        409,
                        'The last administrator cannot be changed to another role',
                        null
                    );
                }
            }

            roleId = roleData.id;
        }

        // Update only provided fields
        user.name = name ?? user.name;
        user.email = normalizedEmail;
        user.age = age ?? user.age;
        user.designation = designation ?? user.designation;
        user.role = roleId;
        if (password !== undefined) {
            user.passwordHash = await bcrypt.hash(password, 12);
        }

        const verification = emailChanged ? createEmailVerificationToken() : null;
        if (verification) {
            user.emailVerifiedAt = null;
            user.emailVerificationTokenHash = verification.tokenHash;
            user.emailVerificationExpiresAt = verification.expiresAt;
        }

        await user.save();
        const safeUser = user.toObject();
        delete safeUser.passwordHash;
        delete safeUser.emailVerificationTokenHash;
        delete safeUser.emailVerificationExpiresAt;

        let emailVerificationSent;
        if (verification) {
            emailVerificationSent = true;
            try {
                await emailService.sendVerificationEmail({
                    email: user.email,
                    name: user.name,
                    token: verification.token
                });
            } catch (error) {
                emailVerificationSent = false;
                console.error('Verification email delivery failed:', error.message);
            }
        }

        return sendResponse(
            res,
            200,
            emailChanged
                ? (emailVerificationSent
                    ? 'Profile updated. A verification email has been sent to the new address.'
                    : 'Email updated, but the verification email could not be sent. Resend it from the profile list.')
                : 'User updated successfully',
            safeUser,
            undefined,
            emailChanged ? { emailVerificationSent } : undefined
        );

    } catch (error) {
        next(error);
    }
};

// Delete User
exports.deleteUser = async (req, res, next) => {
    try {
        const userId = Number(req.query.id || req.params.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return sendResponse(
                res,
                400,
                'Valid user id is required',
                null
            );
        }

        const existingUser = await Profile.findOne({ id: userId });

        if (!existingUser) {
            return sendResponse(
                res,
                404,
                'User not found',
                null
            );
        }

        const userRole = await Role.findOne({ id: existingUser.role }).select('name');
        if (
            userRole?.name === 'ADMIN' &&
            await Profile.countDocuments({ role: existingUser.role }) <= 1
        ) {
            return sendResponse(
                res,
                409,
                'The last administrator cannot be deleted',
                null
            );
        }

        await Profile.deleteOne({ id: userId });

        return sendResponse(
            res,
            200,
            'User deleted successfully',
            null
        );
    } catch (error) {
        next(error);
    }
};

// Get Users

// Get Users
exports.getAllUsers = async (req, res, next) => {
    try {
        const {
            roleId,
            search,
            sortBy,
            sortOrder,
            page: requestedPage,
            size: requestedSize
        } = req.query;

        const page = requestedPage === undefined ? 1 : Number(requestedPage);
        const size = requestedSize === undefined ? 10 : Number(requestedSize);

        if (!Number.isInteger(page) || page < 1) {
            return sendResponse(res, 400, 'Invalid page. Use a positive integer', null);
        }

        if (!Number.isInteger(size) || size < 1 || size > 100) {
            return sendResponse(res, 400, 'Invalid size. Use an integer from 1 to 100', null);
        }

        const filter = {};

        // Filter users by roleId
        if (roleId !== undefined && roleId !== '') {
            const parsedRoleId = Number(roleId);

            if (Number.isNaN(parsedRoleId)) {
                return sendResponse(
                    res,
                    400,
                    'Invalid roleId',
                    null
                );
            }

            filter.role = parsedRoleId;
        }


        // Global search
        if (search !== undefined && search.trim() !== '') {
            const searchValue = search.trim();

            filter.$or = [
                {
                    name: {
                        $regex: searchValue,
                        $options: 'i'
                    }
                },
                {
                    email: {
                        $regex: searchValue,
                        $options: 'i'
                    }
                },
                {
                    designation: {
                        $regex: searchValue,
                        $options: 'i'
                    }
                }
            ];
        }

        // Allowed sort fields
        const allowedSortFields = {
            id: 'id',
            name: 'name',
            designation: 'designation',
            age: 'age',
            role: 'role'
        };

        const selectedSortField =
            allowedSortFields[sortBy] || 'id';

        // Sort order
        let normalizedSortOrder = 'ASC';

        if (sortOrder !== undefined && sortOrder !== '') {
            normalizedSortOrder = sortOrder.toUpperCase();

            if (
                normalizedSortOrder !== 'ASC' &&
                normalizedSortOrder !== 'DESC'
            ) {
                return sendResponse(
                    res,
                    400,
                    'Invalid sortOrder. Use ASC or DESC',
                    null
                );
            }
        }

        const sortDirection =
            normalizedSortOrder === 'ASC' ? 1 : -1;

        const [total, users] = await Promise.all([
            Profile.countDocuments(filter),
            Profile.find(filter)
                .sort({
                    [selectedSortField]: sortDirection,
                    id: sortDirection
                })
                .skip((page - 1) * size)
                .limit(size)
                .lean()
        ]);

        // Get all role IDs used by users
        const roleIds = [
            ...new Set(
                users
                    .map(user => user.role)
                    .filter(
                        roleId =>
                            roleId !== null &&
                            roleId !== undefined
                    )
            )
        ];

        // Get roles using custom id
        const roles = await Role.find({
            id: { $in: roleIds }
        })
            .select('id name description isActive')
            .lean();

        // Create role lookup
        const roleMap = {};

        roles.forEach(role => {
            roleMap[role.id] = role;
        });

        // Attach role information
        const usersWithRoles = users.map(user => ({
            ...user,
            role: roleMap[user.role] || null
        }));

        return sendResponse(
            res,
            200,
            'Users fetched successfully',
            usersWithRoles,
            {
                page,
                size,
                total,
                totalPages: Math.ceil(total / size)
            }
        );

    } catch (error) {
        next(error);
    }
};
