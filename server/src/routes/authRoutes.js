const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const { validateAuthPayload } = require('../middleware/validationMiddleware');

const router = express.Router();

router.post('/register', validateAuthPayload, registerUser);
router.post('/login', validateAuthPayload, loginUser);

module.exports = router;
