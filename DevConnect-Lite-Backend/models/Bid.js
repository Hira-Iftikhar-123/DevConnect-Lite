const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  developer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Developer',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  timeline: {
    type: String,
    required: true,
    enum: ['1-2 weeks', '2-4 weeks', '1-2 months', '2-6 months', '6+ months']
  },
  proposal: {
    type: String,
    required: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  milestones: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    dueDate: {
      type: Date,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    }
  }],
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  message: {
    type: String,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

bidSchema.index({ project: 1, developer: 1 }, { unique: true });
bidSchema.index({ project: 1, status: 1 });
bidSchema.index({ developer: 1, status: 1 });

bidSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existingBid = await this.constructor.findOne({
      project: this.project,
      developer: this.developer
    });
    
    if (existingBid) {
      return next(new Error('Developer has already placed a bid on this project'));
    }
  }
  next();
});

module.exports = mongoose.model('Bid', bidSchema);
