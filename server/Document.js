// server/Document.js
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const DocumentSchema = new Schema({
  _id: { type: String, default: () => new mongoose.Types.ObjectId() },
  title: { type: String, default: 'Untitled Document' },
  data: Object,
});

module.exports = model('Document', DocumentSchema);
