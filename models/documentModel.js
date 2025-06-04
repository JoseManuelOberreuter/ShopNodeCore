const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  fileType: { type: String, enum: ['pdf', 'png', 'txt'], required: true },
  url: { type: String, required: true },
  metadata: {
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  }
});

module.exports = mongoose.model('Document', documentSchema);
