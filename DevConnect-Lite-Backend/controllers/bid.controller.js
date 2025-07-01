const Bid = require('../models/Bid');
const Project = require('../models/Project');
const Developer = require('../models/Developer');

// @route   POST /bids/place
// @access  Private (Developer only)
const placeBid = async (req, res) => {
  try {
    const {
      projectId,
      amount,
      timeline,
      proposal,
      milestones,
      message
    } = req.body;

    if (!projectId || !amount || !timeline || !proposal) {
      return res.status(400).json({ 
        message: 'Please provide all required fields: projectId, amount, timeline, proposal' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        message: 'Bid amount must be greater than 0' 
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.status !== 'open') {
      return res.status(400).json({ message: 'Cannot bid on a project that is not open' });
    }

    // Check if developer is trying to bid on their own project
    if (project.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot bid on your own project' });
    }

    // Check if developer has already placed a bid on this project
    const existingBid = await Bid.findOne({
      project: projectId,
      developer: req.developer._id
    });

    if (existingBid) {
      return res.status(400).json({ message: 'You have already placed a bid on this project' });
    }

    if (milestones && Array.isArray(milestones)) {
      const totalMilestoneAmount = milestones.reduce((sum, milestone) => sum + milestone.amount, 0);
      if (Math.abs(totalMilestoneAmount - amount) > 0.01) {
        return res.status(400).json({ 
          message: 'Total milestone amounts must equal the bid amount' 
        });
      }
    }

    const bid = await Bid.create({
      project: projectId,
      developer: req.developer._id,
      amount,
      timeline,
      proposal,
      milestones: milestones || [],
      message: message || ''
    });

    await bid.populate('project', 'title description budget');
    await bid.populate('developer', 'userId');
    await bid.populate({
      path: 'developer',
      populate: {
        path: 'userId',
        select: 'username fullName'
      }
    });

    res.status(201).json(bid);
  } catch (error) {
    console.error('Place bid error:', error);
    if (error.message === 'Developer has already placed a bid on this project') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};
// Bonus: Fetch all bids for a given project
// @route   GET /projects/:id/bids
// @access  Private (Project owner only)
const getProjectBids = async (req, res) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view bids for this project' });
    }

    const bids = await Bid.find({ project: projectId })
      .populate('developer', 'userId')
      .populate({
        path: 'developer',
        populate: {
          path: 'userId',
          select: 'username fullName email'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Bid.countDocuments({ project: projectId });

    res.json({
      bids,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalBids: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get project bids error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   GET /bids/my-bids
const getMyBids = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { developer: req.developer._id };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const bids = await Bid.find(filter)
      .populate('project', 'title description budget status')
      .populate('project.owner', 'username fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Bid.countDocuments(filter);

    res.json({
      bids,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalBids: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get my bids error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   PUT /bids/:bidId/accept
// @access  Private (Project owner only)
const acceptBid = async (req, res) => {
  try {
    const { bidId } = req.params;

    const bid = await Bid.findById(bidId)
      .populate('project')
      .populate('developer');

    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    if (bid.project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept this bid' });
    }

    if (bid.project.status !== 'open') {
      return res.status(400).json({ message: 'Cannot accept bid on a project that is not open' });
    }

    if (bid.status !== 'pending') {
      return res.status(400).json({ message: 'Bid is not in pending status' });
    }

    bid.status = 'accepted';
    await bid.save();

    await Project.findByIdAndUpdate(bid.project._id, {
      status: 'in-progress',
      selectedDeveloper: bid.developer._id
    });

    await Bid.updateMany(
      { 
        project: bid.project._id, 
        _id: { $ne: bidId },
        status: 'pending'
      },
      { status: 'rejected' }
    );

    res.json({ message: 'Bid accepted successfully', bid });
  } catch (error) {
    console.error('Accept bid error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Bid not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   PUT /bids/:bidId/reject
// @access  Private (Project owner only)
const rejectBid = async (req, res) => {
  try {
    const { bidId } = req.params;

    const bid = await Bid.findById(bidId).populate('project');

    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    if (bid.project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject this bid' });
    }

    if (bid.status !== 'pending') {
      return res.status(400).json({ message: 'Bid is not in pending status' });
    }

    bid.status = 'rejected';
    await bid.save();

    res.json({ message: 'Bid rejected successfully', bid });
  } catch (error) {
    console.error('Reject bid error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Bid not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   PUT /bids/:bidId/withdraw
// @access  Private (Developer only)
const withdrawBid = async (req, res) => {
  try {
    const { bidId } = req.params;

    const bid = await Bid.findById(bidId).populate('project');

    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    if (bid.developer.toString() !== req.developer._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to withdraw this bid' });
    }

    if (bid.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot withdraw a bid that is not pending' });
    }

    bid.status = 'withdrawn';
    await bid.save();

    res.json({ message: 'Bid withdrawn successfully', bid });
  } catch (error) {
    console.error('Withdraw bid error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Bid not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  placeBid,
  getProjectBids,
  getMyBids,
  acceptBid,
  rejectBid,
  withdrawBid
};
