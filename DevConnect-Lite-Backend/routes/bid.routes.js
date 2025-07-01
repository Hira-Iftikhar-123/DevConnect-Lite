const express = require('express');
const router = express.Router();
const {
  placeBid,
  getProjectBids,
  getMyBids,
  acceptBid,
  rejectBid,
  withdrawBid
} = require('../controllers/bid.controller');
const { protect } = require('../middleware/authMiddleware');
const { requireDeveloper, requireUser, requireAuth } = require('../middleware/roleMiddleware');

// @route   POST /bids/place
// @access  Private (Developer only)
router.post('/place', protect, requireDeveloper, placeBid);

// @route   GET /bids/project/:projectId
// @access  Private (Project owner only)
router.get('/project/:projectId', protect, requireAuth, getProjectBids);

// @route   GET /bids/my-bids
// @access  Private (Developer only)
router.get('/my-bids', protect, requireDeveloper, getMyBids);

// @route   PUT /bids/:bidId/accept
// @access  Private (Project owner only)
router.put('/:bidId/accept', protect, requireAuth, acceptBid);

// @route   PUT /bids/:bidId/reject
// @access  Private (Project owner only)
router.put('/:bidId/reject', protect, requireAuth, rejectBid);

// @route   PUT /bids/:bidId/withdraw
// @access  Private (Developer only)
router.put('/:bidId/withdraw', protect, requireDeveloper, withdrawBid);

module.exports = router;
