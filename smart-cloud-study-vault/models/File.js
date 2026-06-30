const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    originalname: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        default: 0
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    folder: {
        type: String,
        default: "General",
        index: true
    },
    favorite: {
        type: Boolean,
        default: false
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("File", fileSchema);