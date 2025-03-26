import React from 'react'
import { useState } from 'react'
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
const CreateGroup = () => {
  const { users, createGroup } = useChatStore();
  const { authUser } = useAuthStore()
  const [groupUsers, setGroupUsers] = useState([authUser._id]);

  const handleCreateGroup = async () => {
    await createGroup({ users: groupUsers, description: "Group Description", name: "Group Name" });
  };
  return (
    <div className='bg-base-300 absolute top-[17vh] right-[35vw] w-[44rem] flex justify-between'>
      <div className='w-full bg-base-100'>

        <button className='bg-gray-50 text-black' onClick={handleCreateGroup}>click</button>
      </div>
      <div className=' w-[50vw]'>

        <h1 className='text-center font-bold text-xl my-4'>Add members</h1>
        <ul className='overflow-y-scroll overflow-x-clip h-[60vh]'>
          {users.map((user) => (
            user._id != authUser._id &&
            <li key={user._id} className='flex justify-center items-center gap-5 p-3 bg-base-200 m-4'>
              <div className=''>
                <img loading="blur"
                  src={user.name !== undefined ? user.profilePic || "/group.png" : user.profilePic || "/avatar.png"}
                  alt={user.name}
                  className="size-12 object-cover rounded-full"
                />
              </div>
              {user.fullName}
              <input className=' ' type="checkbox" id={user._id} name={user.fullName} value={user._id} onChange={(e) => {
                if (e.target.checked) {
                  setGroupUsers([...groupUsers, user._id]);
                } else {
                  setGroupUsers(groupUsers.filter((id) => id !== user._id));
                }
              }} />
              <label htmlFor={user._id}>{user.username}</label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default CreateGroup
