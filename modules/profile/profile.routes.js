const express = require('express');

const router = express.Router();

const profileController = require('./profile.controller');

// Create User
router.post('/createuser', profileController.createUser);

// Get All Users
router.get('/users', profileController.getAllUsers);

// Update User
router.put('/updateuser', profileController.updateUser);

module.exports = router;