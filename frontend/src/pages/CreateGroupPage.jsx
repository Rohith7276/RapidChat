import React from 'react'
import { useState } from 'react'
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from "../store/useAuthStore";
import { Camera } from "lucide-react";
import { X } from 'lucide-react';

const CreateGroupPage = () => {
  const { users, createGroup } = useChatStore();
  const [groupName, setGroupName] = useState("")
  const [groupDesc, setGroupDesc] = useState("")
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [groupUsers, setGroupUsers] = useState([]);
  const [selectedImg, setSelectedImg] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image); 
    };
  };


  const handleCreateGroup = async () => {
    let groupUsersIds = groupUsers.map((user) => user._id);
    if(groupDesc == '' || groupName =='') 
      toast.error("Please fill all the details!");
    await createGroup({ users: groupUsersIds, description: groupDesc, name: groupName, profilePic: selectedImg });
    window.location.href = '/';
  };


  return (
    <div className='h-screen w-screen flex justify-center  pt-8  items-center'>

      <div className='bg-base-200  w-[74rem] h-fit flex justify-between '>
        <div className='w-full bg-base-300 h-full'>
          <div className="flex  items-center gap-4 pt-[5vh] pl-7 pr-5 mb-6 w-full">
            {/* Image uploading */}
            <div className="relative w-[11rem]">
              <img loading="blur"
                src={selectedImg ||  "/group.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 "
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5 text-base-200" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <div className=' mx-6 w-full '>
              <h1>Members</h1>
              <div className='flex gap-2 m-3 h-[4.4rem] border-2 p-2 rounded-lg   w-full '>
                {groupUsers.length == 0 && <h1 className='h-full flex justify-center items-center text-center w-full'>No members selected</h1>}
                {groupUsers.map((user) => (
                  <div key={user}>
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.name}
                      className="size-12 object-cover rounded-full"
                    />
                    <div
                      className="ml-[2rem] mt-[-3rem] absolute cursor-pointer bg-red-600 rounded-full "
                      onClick={() => setGroupUsers(groupUsers.filter((u) => u !== user))}
                    >
                      <X className='text-white h-4 w-4 m-[1px]' />
                    </div>

                  </div>
                ))}
              </div>
            </div>
          </div>


          <div className=' mx-5 px-6 gap-8 flex flex-col py-2'>
            <div>
              <h1>Group Name</h1>
              <input placeholder='Add Group Name' type="text" onChange={(e)=>setGroupName(e.target.value)} className='border-2 p-2 rounded-lg w-full' />
            </div>

            <div>
              <h1>Description</h1>
              <textarea placeholder='Add description' onChange={(e)=>setGroupDesc(e.target.value)} className='border-2 p-2 rounded-lg w-full h-[8rem] ' maxLength={500} />
            </div>

          </div>

          <div className='flex items-center justify-center'>

            <button className='bg-white text-black px-3 py-1 my-3 mb-7 rounded-md' onClick={handleCreateGroup}>Create</button>
          </div>
        </div>
        <div className=' w-[50vw] h-full bg-whidte'>

          <h1 className='text-center font-bold text-xl my-4'>Add members</h1>
          <ul className='  h-full'>
          {users <=1 || groupUsers.length == users.length-1 && <h1 className='text-center '>No users available to add</h1>}
            {users.map((user) => (
              (user._id != authUser._id && !groupUsers.includes(user)) &&
              <li onClick={() => {
                if (!groupUsers.includes(user))
                  setGroupUsers([...groupUsers, user])
              }
              } key={user._id} className='flex justify-center hover:bg-base-100  items-center gap-5 p-3 bg-base-200 m-4 hover:cursor-pointer'>
                <div className=''>
                  <img loading="blur"
                    src={user.profilePic || "/avatar.png"}
                    alt={user.name}
                    className="size-12 object-cover rounded-full"
                  />
                </div>
                {user.fullName}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default CreateGroupPage
