import mongoose from "mongoose";

const aiMessageSchema = new mongoose.Schema(
    {
        conversationKey: {
            type: String,
            required: true,
            index: true,
        },
        text: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["user", "assistant", "memory"],
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
