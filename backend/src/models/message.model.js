import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",  
        },
        type: {
            type: String,
            enum: ["ai", "user"],
            default: "user"
        },
        group: {
            type: Boolean,
            default: false
        },
        groupId: {
            type: String,
            default: "" 
        },
        senderInfo: {
            fullname: {
                type: String,
                default: "",
            },
            ai: {
                type: Boolean,
                default: false
            },
            profilePic: {
                type: String,
                default: ""
            }
        },
        text: {
            type: String,
        },
        image: {
            type: String,
        },
        seen: {
            type: Boolean,
            default: false
        }
    },
    { timestamps:true}
);

const Message = mongoose.model("Message", messageSchema);

export default Message;