import mongoose from "mongoose";

const pdfSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    url: {
        type: String,
        required: true,
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
    },
    uploaderInfo: [{
        uploaderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        fullName: {
            type: String,
            default: ""
        },
        profilePic: {
            type: String, 
            default: ""
        }
    }]
});

const Pdf = mongoose.model('Pdf', pdfSchema);

module.exports = Pdf;