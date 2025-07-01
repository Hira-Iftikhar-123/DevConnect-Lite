const Developer = require('../models/Developer');

const requireDeveloper = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'developer') {
      return res.status(403).json({ message: 'Developer access required' });
    }

    const developerProfile = await Developer.findOne({ userId: req.user._id });
    if (!developerProfile) {
      return res.status(403).json({ message: 'Developer profile not found' });
    }

    req.developer = developerProfile;
    next();
  } catch (error) {
    console.error('Role middleware error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const requireUser = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'User access required. Only users can post projects.' });
    }

    next();
  } catch (error) {
    console.error('Role middleware error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

const requireAuth = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role === 'developer') {
      const developerProfile = await Developer.findOne({ userId: req.user._id });
      if (developerProfile) {
        req.developer = developerProfile;
      }
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { requireDeveloper, requireUser, requireAuth };
