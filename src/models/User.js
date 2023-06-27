const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    userID: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        minlength: [6, 'Password must have more than 6 characters'],
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;