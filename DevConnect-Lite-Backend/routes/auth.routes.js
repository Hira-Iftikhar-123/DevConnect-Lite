const express = require('express');
const router = express.Router();
const { 
  signupUser, 
  signupDeveloper, 
  login, 
  getProfile 
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup/user', signupUser);

router.post('/signup/developer', signupDeveloper);

router.post('/login', login);

router.get('/profile', protect, getProfile);

module.exports = router;
