const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usingRequestSchema = new Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    usageDepartment: {
        type: String,
        require: true,
    },
    deviceName: {
        type: String,
        require: true,
    },
    quantity: {
        type: Number,
        require: true,
    },
    startDate: {
        type: Date,
        require: true,
    },
    endDate: {
        type: Date,
        require: true,
    },
    status: {
        type: String,
        default: 'Đang chờ duyệt',
        require: true,
    },
}, { timestamps: true });

const UsingRequest = mongoose.model('UsingRequest', usingRequestSchema);

module.exports = UsingRequest;