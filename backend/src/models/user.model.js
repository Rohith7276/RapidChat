import mongoose from "mongoose";

// creating schema
const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        fullName: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        profilePic: {
            type: String,
            default:"",
        }, 
        friends: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        groups: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Group", 
            },
        ],
    },
    { timestamps : true}
);

const User = mongoose.model("User", userSchema);

// note ooonly remeber that use uppercase and singular convention with mongoose like User not users . . . etc . . .

export default User;