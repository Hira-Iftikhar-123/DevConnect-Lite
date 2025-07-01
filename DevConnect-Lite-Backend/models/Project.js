const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['web-development', 'mobile-development', 'design', 'data-science', 'ai-ml', 'devops', 'other']
  },
  skills: [{
    type: String,
    trim: true
  }],
  budget: {
    min: {
      type: Number,
      required: true,
      min: 0
    },
    max: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  timeline: {
    type: String,
    enum: ['1-2 weeks', '2-4 weeks', '1-2 months', '2-6 months', '6+ months'],
    required: true
  },
  complexity: {
    type: String,
    enum: ['simple', 'moderate', 'complex', 'expert'],
    default: 'moderate'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'completed', 'cancelled'],
    default: 'open'
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  deliverables: [{
    type: String,
    trim: true
  }],
  selectedDeveloper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Developer',
    default: null
  },
  deadline: {
    type: Date,
    required: true
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


projectSchema.index({ status: 1, category: 1, skills: 1, createdAt: -1 });
projectSchema.index({ owner: 1, status: 1 });

module.exports = mongoose.model('Project', projectSchema);
