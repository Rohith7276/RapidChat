import { generateToken } from "../lib/utils.js"; 
import User from "../models/user.model.js";
import Message from "../models/message.model.js"; 
import { cloudinary } from "../lib/cloudinary.js"; 
import bcrypt from "bcryptjs";
// import  { uploadOnCloudinary } from "../lib/cloudinary.js";



export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      // generate jwt token here
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    // console.log("uploadResponse");
    const uploadResponse = await cloudinary.uploader.upload(profilePic); 
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.url },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    // console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addFriend = async (req, res) => {
  try {
    const { email: friendEmail } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const friend = await User.findOne({ email: friendEmail });

    if (!friend) return res.status(404).json({ message: "Friend not found" });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user._id.toString() === friend._id.toString()) return res.status(400).json({ message: "You can't add yourself as friend" })
    if (user.friends.find(f => friend._id.toString() === f.toString())) return res.status(400).json({ message: "Friend already added" })



    const updatedUser = await User.findByIdAndUpdate(
      user?._id, {
      $set: {
        friends: [...req.user.friends, friend._id]
      }
    },
      { new: true }
    ).select("-password");
    if (!updatedUser) return res.status(404).json({ message: "Friend not added" })

    const updatedFriend = await User.findByIdAndUpdate(
      friend?._id, {
      $set: {
        friends: [...friend.friends, user._id]
      }
    },
      { new: true }
    ).select("-password");
    if (!updatedFriend) return res.status(404).json({ message: "Friend not added" })

    // user.friends.push(friend._id);
    // await user.save();
    res.status(201).json({updatedFriends: user.friends });
  }
  catch (error) {
    console.error("Error in addFriend: ", error.message)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const removeFriend = async (req, res) => {
  try {
    const { email: friendEmail } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    const friend = await User.findOne({ email: friendEmail });

    if (!friend) return res.status(404).json({ message: "Friend not found" });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.friends.find(f => friend._id.toString() === f.toString())) return res.status(400).json({ message: "No available friend to remove" })


    let messages = await Message.deleteMany({
      $or: [
        { senderId: user._id, receiverId: friend._id },
        { senderId: friend._id, receiverId: user._id },
      ],
    })
    if (!messages) return res.status(404).json({ message: "Messages not deleted" })
    const updatedUser = await User.findByIdAndUpdate(
      user?._id, {
      $set: {
        friends: user.friends.filter(f => f.toString() !== friend._id.toString())
      }
    },
      { new: true }
    ).select("-password");
    if (!updatedUser) return res.status(404).json({ message: "Friend not removed" })

    const updatedFriend = await User.findByIdAndUpdate(
      friend?._id, {
      $set: {
        friends: friend.friends.filter(f => f.toString() !== user._id.toString())
      }
    },
      { new: true }
    ).select("-password");
    if (!updatedFriend) return res.status(404).json({ message: "Friend not removed" })

     
    res.status(201).json({ updatedFriends: user.friends });
  }
  catch (error) {
    console.error("Error in addFriend: ", error.message)
    res.status(500).json({ error: "Internal server error" })
  }
}

