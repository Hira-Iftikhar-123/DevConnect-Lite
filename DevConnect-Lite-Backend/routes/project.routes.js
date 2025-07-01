const express = require('express');
const router = express.Router();
const {
  createProject,
  getOpenProjects,
  getProjectById,
  getMyProjects,
  updateProject,
  deleteProject,
  exportProjectsToJSON
} = require('../controllers/project.controller');
const { getProjectBids } = require('../controllers/bid.controller');
const { protect } = require('../middleware/authMiddleware');
const { requireUser, requireDeveloper, requireAuth } = require('../middleware/roleMiddleware');

// Bonus: Export projects to JSON
// @route   GET /projects/export-json
router.get('/export-json', protect, requireUser, exportProjectsToJSON);

// @route   POST /projects/create
router.post('/create', protect, requireUser, createProject);

// @route   GET /projects/my-projects
// @desc    Get user's projects
router.get('/my-projects', protect, requireAuth, getMyProjects);


// @route   GET /projects/open
// @desc    Get all open projects (for developers)
router.get('/open', protect, requireDeveloper, getOpenProjects);

// @route   GET /projects/:id
router.get('/:id', protect, requireAuth, getProjectById);

// @route   PUT /projects/:id
router.put('/:id', protect, requireAuth, updateProject);

// @route   DELETE /projects/:id
router.delete('/:id', protect, requireAuth, deleteProject);

// Bonus: Fetch all bids for a given project
// @route   GET /projects/:id/bids
router.get('/:id/bids', protect, requireAuth, getProjectBids);

module.exports = router;
