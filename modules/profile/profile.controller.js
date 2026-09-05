const Profile = require('./profile.model');
const sendResponse = require('../../utils/response');
const getNextSequence = require('../../utils/counter');
const Role = require('../roles/role.model');
// Create User
exports.createUser = async (req, res, next) => {
    try {
        const {
            name,
            email,
            age,
            designation,
            role
        } = req.body;

        // Check if email already exists
        const existingUser = await Profile.findOne({ email });

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

        const profile = await Profile.create({
            id: profileId,
            name,
            email,
            age,
            designation,
            role: roleData.id
        });

        return sendResponse(
            res,
            201,
            'User created successfully',
            profile
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
            role
        } = req.body;

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

        // If email is being changed, check duplicate
        if (email && email !== user.email) {
            const existingUser = await Profile.findOne({
                email,
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

            roleId = roleData.id;
        }

        // Update only provided fields
        user.name = name ?? user.name;
        user.email = email ?? user.email;
        user.age = age ?? user.age;
        user.designation = designation ?? user.designation;
        user.role = roleId;

        await user.save();

        return sendResponse(
            res,
            200,
            'User updated successfully',
            user
        );

    } catch (error) {
        next(error);
    }
};


// Get Users
exports.getAllUsers = async (req, res, next) => {
    try {

        const users = await Profile.find()
            .sort({ id: 1 })
            .lean();

        // Get all role IDs used by users
        const roleIds = [
            ...new Set(
                users
                    .map(user => user.role)
                    .filter(roleId => roleId !== null && roleId !== undefined)
            )
        ];

        // Get roles using custom id
        const roles = await Role.find({
            id: { $in: roleIds }
        })
            .select('id name description isActive')
            .lean();

        // Create lookup object
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
            usersWithRoles
        );

    } catch (error) {
        next(error);
    }
};