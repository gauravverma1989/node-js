const express = require('express');

const router = express.Router();

const roleController = require('./role.controller');

router.post('/create', roleController.createRole);

router.get('/list', roleController.getRoles);

router.put('/update', roleController.updateRole);

router.delete('/delete', roleController.deleteRole);

module.exports = router;