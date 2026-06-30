const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        default: null
    },
    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

/* Don't return password in JSON responses */
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

module.exports = mongoose.model("User", userSchema);