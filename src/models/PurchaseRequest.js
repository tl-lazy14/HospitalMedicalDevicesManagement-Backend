const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const purchaseRequestSchema = new Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    deviceName: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    unitPriceEstimated: {
        type: Number,
    },
    totalAmountEstimated: {
        type: Number,
    },
    dateOfRequest: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        default: 'Đang chờ duyệt',
        required: true,
    },
}, { timestamps: true });

const PurchaseRequest = mongoose.model('PurchaseRequest', purchaseRequestSchema);

module.exports = PurchaseRequest;