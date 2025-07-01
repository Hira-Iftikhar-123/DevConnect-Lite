const Project = require('../models/Project');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// @route   POST /projects/create
// @access  Private (User only)
const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      skills,
      budget,
      timeline,
      complexity,
      requirements,
      deliverables,
      deadline
    } = req.body;

    if (!title || !description || !category || !budget || !timeline || !deadline) {
      return res.status(400).json({ 
        message: 'Please provide all required fields: title, description, category, budget, timeline, deadline' 
      });
    }

    if (budget.min > budget.max) {
      return res.status(400).json({ 
        message: 'Minimum budget cannot be greater than maximum budget' 
      });
    }

    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      return res.status(400).json({ 
        message: 'Deadline must be in the future' 
      });
    }

    const project = await Project.create({
      title,
      description,
      owner: req.user._id,
      category,
      skills: skills || [],
      budget,
      timeline,
      complexity: complexity || 'moderate',
      requirements: requirements || [],
      deliverables: deliverables || [],
      deadline: deadlineDate
    });

    await project.populate('owner', 'username fullName email role');

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET /projects/open
// @access  Private (Developer only)
const getOpenProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { status: 'open' };

    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.skills) {
      const skills = req.query.skills.split(',');
      filter.skills = { $in: skills };
    }

    if (req.query.minBudget || req.query.maxBudget) {
      filter.budget = {};
      if (req.query.minBudget) {
        filter.budget.min = { $gte: parseInt(req.query.minBudget) };
      }
      if (req.query.maxBudget) {
        filter.budget.max = { $lte: parseInt(req.query.maxBudget) };
      }
    }

    const projects = await Project.find(filter)
      .populate('owner', 'username fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Project.countDocuments(filter);

    res.json({
      projects,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProjects: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get open projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET /projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'username fullName email')
      .populate('selectedDeveloper', 'userId')
      .populate({
        path: 'selectedDeveloper',
        populate: {
          path: 'userId',
          select: 'username fullName email'
        }
      });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project by ID error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET /projects/my-projects
// @access  Private
const getMyProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { owner: req.user._id };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const projects = await Project.find(filter)
      .populate('selectedDeveloper', 'userId')
      .populate({
        path: 'selectedDeveloper',
        populate: {
          path: 'userId',
          select: 'username fullName email'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Project.countDocuments(filter);

    res.json({
      projects,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProjects: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get my projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   PUT /projects/:id
// @access  Private (Project owner only)
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    if (project.status !== 'open') {
      return res.status(400).json({ message: 'Cannot update project that is not open' });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'username fullName email');

    res.json(updatedProject);
  } catch (error) {
    console.error('Update project error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   DELETE /projects/:id
// @access  Private (Project owner only)
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }

    if (project.status !== 'open') {
      return res.status(400).json({ message: 'Cannot delete project that is not open' });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Bonus: Export projects to JSON
// @route   GET /projects/export-json
// @access  Private (optional: restrict to admins or owners)
const exportProjectsToJSON = async (req, res) => {
  try {
    const projects = await Project.find().populate('owner', 'username fullName email');

    const filePath = path.join(__dirname, '../exports/projects_export.json');

    fs.writeFileSync(filePath, JSON.stringify(projects, null, 2), 'utf-8');

    res.status(200).json({
      message: 'Projects exported successfully!',
      file: '/exports/projects_export.json'
    });
  } catch (error) {
    console.error('Export JSON error:', error);
    res.status(500).json({ message: 'Failed to export projects' });
  }
};

module.exports = {
  createProject,
  getOpenProjects,
  getProjectById,
  getMyProjects,
  updateProject,
  deleteProject,
  exportProjectsToJSON
};
