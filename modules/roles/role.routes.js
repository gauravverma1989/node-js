const express = require('express');

const router = express.Router();

const roleController = require('./role.controller');

router.post('/create', roleController.createRole);

router.get('/list', roleController.getRoles);

router.get('/get-by-role', roleController.getRoleById);

router.put('/update-by-role', roleController.updateRole);

router.delete('/delete-by-role', roleController.deleteRole);

module.exports = router;