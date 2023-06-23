const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    staffID: {
        type: String,
        require: true,
    },
    email: {
        type: String,
        require: true,
    },
    password: {
        type: String,
        minLength: [6, 'Password must have more than 6 characters'],
        require: true,
    },
    name: {
        type: String,
        require: true,
    },
    role: {
        type: Boolean,
        default: false,
        require: true,
    },
    department: {
        type: String,
        require: true,
    },
    usingRequestHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UsingRequest',
        }
    ],
    faultReportHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FaultRepair',
        }
    ],
    purchaseRequestHistory: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PurchaseRequest',
        }
    ],
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;