const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    age: {
        type: Number,
        required: true
    },

    designation: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Profile', profileSchema, 'profile');