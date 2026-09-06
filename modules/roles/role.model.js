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
            default: '',
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
            required: true,
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Role', roleSchema);