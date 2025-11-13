const express = require('express');
const router = express.Router();
const authToken = require('../middleware/authToken');
const groupController = require('../controllers/groupController');

router.post('/', authToken, groupController.createGroup);
router.get('/', authToken, groupController.getMyGroups);
router.post('/:groupId/tasks', authToken, groupController.addTaskToGroup);
router.delete('/:groupId', authToken, groupController.deleteGroup);

module.exports = router;
