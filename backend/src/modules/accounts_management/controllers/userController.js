// backend/src/modules/accounts_management/controllers/userController.js
// Request/response handling for user account management

const userService = require('../services/userService');
const { successResponse } = require('../../../utils/responseHelper');
const { asyncHandler } = require('../../../middleware/errorHandler');

class UserController {
    // List all users (or filter by role for Employee List view)
    getAllUsers = asyncHandler(async (req, res) => {
        const users = await userService.getAllUsers(req.query);
        return successResponse(res, users, 'Users retrieved successfully');
    });

    // Create a new user account
    createUser = asyncHandler(async (req, res) => {
        const user = await userService.createUser(req.body);
        return successResponse(res, user, 'Account created successfully', 201);
    });

    // Bulk deactivate users
    bulkDeactivate = asyncHandler(async (req, res) => {
        const result = await userService.bulkDeactivate(req.body);
        return successResponse(
            res,
            result,
            `${result.deactivated_count} user(s) deactivated successfully`
        );
    });
    // Reactivate a single user
    reactivateUser = asyncHandler(async (req, res) => {
        const user = await userService.reactivateUser(req.params.id);
        return successResponse(res, user, 'User reactivated successfully');
    });

    // Bulk reactivate users
    bulkReactivate = asyncHandler(async (req, res) => {
        const result = await userService.bulkReactivate(req.body);
        return successResponse(
            res,
            result,
            `${result.reactivated_count} user(s) reactivated successfully`
        );
    });
    // Update user profile
    updateUser = asyncHandler(async (req, res) => {
        const user = await userService.updateUser(req.params.id, req.body);
        return successResponse(res, user, 'User updated successfully');
    });
}

module.exports = new UserController();
