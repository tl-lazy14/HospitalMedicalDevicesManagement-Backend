const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usingRequestSchema = new Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    usageDepartment: {
        type: String,
        required: true,
    },
    deviceName: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        default: 'Đang chờ duyệt',
        required: true,
    },
}, { timestamps: true });

const UsingRequest = mongoose.model('UsingRequest', usingRequestSchema);

module.exports = UsingRequest;