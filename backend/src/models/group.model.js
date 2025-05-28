import mongoose from "mongoose";
 
const groupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        profilePic: {
            type: String,
            default: "",
        },
        description: {
            type: String,
            required: true,
        },
        groupIcon: {
            type: String,
            default: "",
        },
        videoCall: [{
            type: String,
            default: "",
        }],
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        ],   
    },
    {
        timestamps: true,
    }
);

export const  Group = mongoose.model("Group", groupSchema);