const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Developer = require('../models/Developer');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @route POST /auth/signup/user
const signupUser = async (req, res) => {
  try {
    const { username, email, password, fullName, bio, location } = req.body;

    const userExists = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (userExists) {
      return res.status(400).json({ 
        message: 'User already exists with this email or username' 
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      fullName,
      bio: bio || '',
      location: location || '',
      role: 'user'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        bio: user.bio,
        location: user.location,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Signup user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route POST /auth/signup/developer
const signupDeveloper = async (req, res) => {
  try {
    const { 
      username, 
      email, 
      password, 
      fullName, 
      skills, 
      experience, 
      yearsOfExperience, 
      hourlyRate,
      bio,
      location,
      portfolio
    } = req.body;

    const userExists = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (userExists) {
      return res.status(400).json({ 
        message: 'User already exists with this email or username' 
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      fullName,
      bio: bio || '',
      location: location || '',
      role: 'developer'
    });

    if (user) {
      const developer = await Developer.create({
        userId: user._id,
        skills: skills || [],
        experience: experience || 'entry',
        yearsOfExperience: yearsOfExperience || 0,
        hourlyRate: hourlyRate || 0,
        portfolio: portfolio || {
          github: '',
          linkedin: '',
          website: '',
          projects: []
        }
      });

      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        bio: user.bio,
        location: user.location,
        developerProfile: {
          skills: developer.skills,
          experience: developer.experience,
          yearsOfExperience: developer.yearsOfExperience,
          hourlyRate: developer.hourlyRate,
          portfolio: developer.portfolio
        },
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Signup developer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route POST /auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      let developerProfile = null;

      if (user.role === 'developer') {
        developerProfile = await Developer.findOne({ userId: user._id });
      }

      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        bio: user.bio,
        location: user.location,
        developerProfile: developerProfile ? {
          skills: developerProfile.skills,
          experience: developerProfile.experience,
          yearsOfExperience: developerProfile.yearsOfExperience,
          hourlyRate: developerProfile.hourlyRate,
          portfolio: developerProfile.portfolio,
          availability: developerProfile.availability,
          rating: developerProfile.rating,
          completedProjects: developerProfile.completedProjects
        } : null,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route GET /auth/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (user) {
      let developerProfile = null;

      if (user.role === 'developer') {
        developerProfile = await Developer.findOne({ userId: user._id });
      }

      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        bio: user.bio,
        location: user.location,
        developerProfile: developerProfile ? {
          skills: developerProfile.skills,
          experience: developerProfile.experience,
          yearsOfExperience: developerProfile.yearsOfExperience,
          hourlyRate: developerProfile.hourlyRate,
          portfolio: developerProfile.portfolio,
          availability: developerProfile.availability,
          rating: developerProfile.rating,
          completedProjects: developerProfile.completedProjects
        } : null
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  signupUser,
  signupDeveloper,
  login,
  getProfile
};
