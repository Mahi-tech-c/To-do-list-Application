const express = require('express');
const { getTasks, createTask, updateTask, deleteTask, getTaskById } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { validateTaskPayload } = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', validateTaskPayload, createTask);
router.put('/:id', validateTaskPayload, updateTask);
router.patch('/:id', validateTaskPayload, updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
