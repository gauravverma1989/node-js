const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
    {
        id: {
        type: Number,
        unique: true,
        required: true
    },
        name: {
            type: String,
            required: true,
            unique: true,
            enum: ['ADMIN', 'USER'],
            uppercase: true,
            trim: true
        },
        description: {
            type: String,
            default: ''
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Role', roleSchema);