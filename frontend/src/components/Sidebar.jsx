import { useEffect,  useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";

const Sidebar = () => {
  const { getUsers, getNotifications, getStreamCreation, streamMode,  sidebarRefresh, setSidebarRefresh, groups, users, selectedUser, setSelectedUser, isUsersLoading, addFriend } = useChatStore();

  const { onlineUsers, authUser } = useAuthStore();
  const [friendId, setFriendId] = useState("");  

  useEffect(() => { 
    if(sidebarRefresh) {
      getUsers(); 
      console.log(authUser)
      console.log('refreshih', sidebarRefresh)
      setSidebarRefresh(false)
    }
  }, [sidebarRefresh ]); 

  useEffect(() => {  
      getNotifications();
      getStreamCreation();
      getUsers(); 
  }, [  ]); 

  const filteredUsers = [...users, ...groups];

  if (isUsersLoading ) return <SidebarSkeleton />;


  return (
    <aside className={`h-full w-24 ${streamMode?" ":"lg:w-72"} border-r border-base-300 flex flex-col transition-all duration-200`}>
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className={`hidden ${streamMode?"":"lg:block "} font-medium  `}>Contacts</span>
        </div>
        {/* <input type="text" onChange={(e) => setFriendId(e.target.value)} />
        <button onClick={handleAddFriend}>add</button> */}
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`
              w-full p-3 flex items-center gap-3
              hover:bg-base-300 transition-colors
              ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
            `}
          >
            <div className="relative mx-auto lg:mx-0">
              <img loading="blur"
                src={user.name !== undefined ? user.profilePic || "/group.png" : user.profilePic || "/avatar.png"}
                alt={user.name}
                className="size-12 object-cover rounded-full brightness-95"
              />
              {onlineUsers.includes(user._id) && (
                <span
                  className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-zinc-900"
                />
              )}
            </div>

            {/* User info - only visible on larger screens */}
            <div className={`hidden ${streamMode?"":"lg:block "} text-left min-w-0` }>
              <div className="font-medium truncate">{user.fullName || user.name}</div>
              <div className="text-sm text-zinc-400 flex">
                {/* {onlineUsers.includes(user._id) ? "Online" : "Offline"} */}
                {user.name && <span className="text-green-400 font-semibold pr-1">{user.timeline.senderId == authUser._id? "You :" : "Idk :"}</span>}
                <div className="overflow-x-hidden flex "><span>{user.timeline.text.slice(0,20)}</span> <span> {user.timeline.text.length >=20 ? "...": ""}</span></div>
              </div>
            </div>
          </button>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No online users</div>
        )}
      </div>

    </aside>
  );
};
export default Sidebar;