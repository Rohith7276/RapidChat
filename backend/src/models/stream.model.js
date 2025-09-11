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
             
            url: {
                type: String, 
            },
            name: {
                type: String,
            },
            data: {
                type: String, 
            },
            type: {
                type: String, 
                enum: ["youtube", "pdf", "website"], 
            },
            title: {
                type: String, 
            },
            description:{
                type: String, 
            }            
        }, 
        summary: {
            type: String,
        }
    },
    { timestamps:true}
);

const Stream = mongoose.model("Stream", streamSchema);

export default Stream;