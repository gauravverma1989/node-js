const Profile = require('./profile.model');
const sendResponse = require('../../utils/response');
const getNextSequence = require('../../utils/counter');

// Create User
exports.createUser = async (req, res, next) => {
    try {
        const id = await getNextSequence('profile');

        const profile = await Profile.create({
            ...req.body,
            id
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


// Get All Users
exports.getAllUsers = async (req, res, next) => {
    try {
        console.log('GET ALL USERS - START');

        const profiles = await Profile.find();

        console.log('GET ALL USERS - FOUND:', profiles.length);

        return res.status(200).json({
            code: 200,
            success: true,
            message: 'Users fetched successfully',
            data: profiles
        });

    } catch (error) {
        console.error('GET ALL USERS ERROR:', error);
        next(error);
    }
};


// Update User
exports.updateUser = async (req, res, next) => {
    try {
        const { id } = req.query;

        if (!id) {
            return sendResponse(
                res,
                400,
                'User ID is required'
            );
        }

        const numericId = Number(id);

        if (!Number.isInteger(numericId) || numericId < 1) {
            return sendResponse(
                res,
                400,
                'Invalid User ID'
            );
        }

        // Remove id from body so user cannot change the ID
        const { id: bodyId, ...updateData } = req.body;

        const profile = await Profile.findOneAndUpdate(
            { id: numericId },
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!profile) {
            return sendResponse(
                res,
                404,
                'User not found'
            );
        }

        return sendResponse(
            res,
            200,
            'User updated successfully',
            profile
        );

    } catch (error) {
        next(error);
    }
};