import mongoose from "mongoose";

const streamSchema = new mongoose.Schema(
    {
        streamerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",  
            default: ""
        }, 
        groupId: {
            type: String,
            default: "" 
        },
        senderInfo: {
            fullName: {
                type: String,
                default: "",
            }, 
            profilePic: {
                type: String,
                default: ""
            }
        }, 
        streamInfo: {
            videoUrl: {
                type: String,
                required: true
            },
            title: {
                type: String,
                requrired: true
            },
            description:{
                type: String,
                required: true
            }            
        },
        stopTime: {
            type: Date,
            default: null
        },
        summary: {
            type: String,
        }
    },
    { timestamps:true}
);

const Stream = mongoose.model("Stream", streamSchema);

export default Stream;