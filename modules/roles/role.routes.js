const express = require('express');

const router = express.Router();

const roleController = require('./role.controller');
const authenticateToken = require('../../middleware/authenticateToken');
const requireAdmin = require('../../middleware/requireAdmin');

router.use(authenticateToken, requireAdmin);

router.post('/create', roleController.createRole);

router.get('/list', roleController.getRoles);

router.put('/update', roleController.updateRole);

router.delete('/delete', roleController.deleteRole);

module.exports = router;
