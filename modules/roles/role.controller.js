const Role = require('./role.model');
const sendResponse = require('../../utils/response');
const getNextSequence = require('../../utils/counter');


// Create Role
exports.createRole = async (req, res, next) => {
    try {
        const { name, description } = req.body;

        const roleName = name.toUpperCase();

        const existingRole = await Role.findOne({
            name: roleName
        });

        if (existingRole) {
            return sendResponse(
                res,
                409,
                'Role already exists',
                null
            );
        }

        const roleId = await getNextSequence('role');

        const role = await Role.create({
            id: roleId,
            name: roleName,
            description: description || ''
        });

        return sendResponse(
            res,
            201,
            'Role created successfully',
            role
        );

    } catch (error) {
        next(error);
    }
};


exports.getRoles = async (req, res, next) => {
    try {
        const {
            id,
            sortBy = 'id',
            sortOrder = 'asc'
        } = req.query;

        const filter = {};

        // Filter by ID
        if (id !== undefined && id !== '') {
            const roleId = Number(id);

            if (Number.isNaN(roleId)) {
                return sendResponse(
                    res,
                    400,
                    'Invalid role id',
                    null
                );
            }

            filter.id = roleId;
        }

        // Sort
        const sortDirection =
            sortOrder.toLowerCase() === 'desc' ? -1 : 1;

        const roles = await Role.find(filter)
            .sort({ [sortBy]: sortDirection });

        return sendResponse(
            res,
            200,
            'Roles fetched successfully',
            roles
        );

    } catch (error) {
        next(error);
    }
};


// Update Role By Custom ID
exports.updateRole = async (req, res, next) => {
    try {
        const roleId = Number(req.query.id);

        if (!roleId) {
            return sendResponse(
                res,
                400,
                'Role id is required',
                null
            );
        }

        const { name, description, isActive } = req.body;

        const role = await Role.findOne({
            id: roleId
        });

        if (!role) {
            return sendResponse(
                res,
                404,
                'Role not found',
                null
            );
        }

        // Check duplicate role name
        if (name) {
            const roleName = name.toUpperCase();

            const existingRole = await Role.findOne({
                name: roleName,
                id: { $ne: roleId }
            });

            if (existingRole) {
                return sendResponse(
                    res,
                    409,
                    'Role already exists',
                    null
                );
            }

            role.name = roleName;
        }

        if (description !== undefined) {
            role.description = description;
        }

        if (isActive !== undefined) {
            role.isActive = isActive;
        }

        await role.save();

        return sendResponse(
            res,
            200,
            'Role updated successfully',
            role
        );

    } catch (error) {
        next(error);
    }
};


// Delete Role By Custom ID
exports.deleteRole = async (req, res, next) => {
    try {
        const roleId = Number(req.query.id);

        if (!roleId) {
            return sendResponse(
                res,
                400,
                'Role id is required',
                null
            );
        }

        const role = await Role.findOne({
            id: roleId
        });

        if (!role) {
            return sendResponse(
                res,
                404,
                'Role not found',
                null
            );
        }

        await Role.deleteOne({
            id: roleId
        });

        return sendResponse(
            res,
            200,
            'Role deleted successfully',
            null
        );

    } catch (error) {
        next(error);
    }
};