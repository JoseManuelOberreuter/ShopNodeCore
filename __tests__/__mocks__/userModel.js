const mongoose = require('mongoose');

const User = jest.fn().mockImplementation(() => ({
  save: jest.fn().mockResolvedValue(true),
  toObject: jest.fn().mockReturnThis()
}));

User.findOne = jest.fn();
User.findById = jest.fn();
User.findOneAndUpdate = jest.fn();
User.deleteOne = jest.fn();

module.exports = User; 