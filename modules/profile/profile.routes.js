const express = require('express');

const router = express.Router();

const profileController = require('./profile.controller');
const authenticateToken = require('../../middleware/authenticateToken');
const requireAdmin = require('../../middleware/requireAdmin');

router.use(authenticateToken, requireAdmin);

// Create User
router.post('/createuser', profileController.createUser);

// Get All Users
router.get('/users', profileController.getAllUsers);

// Update User
router.put('/updateuser', profileController.updateUser);

// Delete User
router.delete('/deleteuser', profileController.deleteUser);

module.exports = router;
