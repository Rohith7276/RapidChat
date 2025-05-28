import mongoose from "mongoose";

const aiMessageSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", 
        },
        groupId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
        },
        seen: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

export const AiMessage = mongoose.model("AiMessage", aiMessageSchema);
