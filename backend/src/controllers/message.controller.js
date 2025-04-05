import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import mongoose from "mongoose"; 
import { cloudinary } from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import  client  from "../lib/redisClient.js";

export const getUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const userWithFriends = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(loggedInUserId),
        },
      },
      {
        $lookup: {
          from: "users", // Friends are stored as user references in the User model
          localField: "friends",
          foreignField: "_id",
          as: "friends",
          pipeline: [
            {
              $lookup: {
                from: "messages",
                let: { userId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $or: [
                          {$and: [{ $eq: ["$senderId", "$$userId"] }, {$eq: ["$group", false]} ]},
                          { $eq: ["$receiverId", "$$userId"] }
                        ]
                      }
                    }
                  },
                  {
                    $project: {
                      createdAt: 1,
                      text: 1,
                      senderId: 1, 
                    }
                  }
                ],
                as: "timeline"
              }
            },
            {
              $project: {
                fullName: 1, 
                profilePic: 1,
                timeline: { $arrayElemAt: ["$timeline", -1] } // Get the last message for each friend
              }
            }
          ],
        }
      }, 
      {
        $project: {
          friends: 1, // Only include friend details in output 
        },
      },
    ]); 
    const groups = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(loggedInUserId),
        },
      },
      {
        $lookup: {
          from: "groups",
          localField: "groups",
          foreignField: "_id",
          as: "userGroups",
          pipeline: [
            {
              $lookup: {
                from: "messages",
                let: { groupId: { $toString: "$_id" }},  
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$groupId",  "$$groupId"  ] }   
                    }
                  },
                  { $sort: { createdAt: -1 } },  
                  {
                    $project: {
                      createdAt: 1,
                      text: 1,
                      senderId: 1,
                      senderInfo: 1, 
                    }
                  }
                ],
                as: "timeline"
              }
            },
            {
              $project: {
                _id: 1,
                name: 1,
                profilePic: 1,
                timeline: { $arrayElemAt: ["$timeline", 0] } 
              }
            }
          ]
        }
      }
       
    ]); 
    userWithFriends[0].friends = [...userWithFriends[0].friends, ...groups[0]?.userGroups]
    if (userWithFriends[0]?.friends?.length > 0) {
      userWithFriends[0].friends.sort((a, b) =>
        new Date(b.timeline?.createdAt || 0) - new Date(a.timeline?.createdAt || 0)
      );
    }

    // console.log(userWithFriends[0].friends[0], userWithFriends[0].friends[1])
    // console.log(userWithFriends[0].friends[0].timeline.text, userWithFriends[0].friends[1].timeline.text)

    res.status(200).json(userWithFriends.length ? userWithFriends[0].friends : []);


  } catch (error) {
    console.error("Error in getUsers: ", error.message);
    res.status(500).json({ error: "Internal server error" });
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



export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId, page } = req.params;
    const myId = req.user?._id;


    if (!myId) {
      return res.status(400).json({ error: "User ID is required" });
    }



    let messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    })
      .sort({ createdAt: -1 })
      // .limit(page * 100) 

    messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    await client.set('messages' + req.user?._id + req.params.id, JSON.stringify(messages), { EX: 60 });
    res.status(200).json(messages);

  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const seenMessage = async (req, res) => {
  try {
    const { id: userId } = req.params;
    await Message.findByIdAndUpdate({ receiverId: req.user._id, senderId: userId }, { seen: true }, { multi: true });
    return res.status(200).json("Messages seen");
  }
  catch (error) {
    console.log("Error in seenMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
      io.to(receiverSocketId).emit("notification", "newMessage");
    }
    await client.del('messages'+ req.user._id + req.params.id); 

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};