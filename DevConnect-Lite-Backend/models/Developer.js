const mongoose = require('mongoose');

const developerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  experience: {
    type: String,
    enum: ['entry', 'intermediate', 'senior', 'expert'],
    default: 'entry'
  },
  yearsOfExperience: {
    type: Number,
    min: 0,
    default: 0
  },
  hourlyRate: {
    type: Number,
    min: 0,
    default: 0
  },
  portfolio: {
    github: {
      type: String,
      default: ''
    },
    linkedin: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      default: ''
    },
    projects: [{
      title: String,
      description: String,
      technologies: [String],
      link: String
    }]
  },
  availability: {
    type: String,
    enum: ['available', 'busy', 'unavailable'],
    default: 'available'
  },
  completedProjects: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  specializations: [{
    type: String,
    trim: true
  }],
  languages: [{
    type: String,
    trim: true
  }],
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

developerSchema.index({ skills: 1, experience: 1, availability: 1 });

module.exports = mongoose.model('Developer', developerSchema);
