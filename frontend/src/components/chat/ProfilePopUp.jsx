import React, { useRef, useState } from 'react'
import { ChevronRight, Group, GroupIcon, HistoryIcon, LucideGroup, Mail, Users, X } from 'lucide-react';
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react";
import { Menu } from 'lucide-react';
import { LogOut, Settings, User } from "lucide-react";
import { useStreamStore } from "../../store/useStreamStore";


import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import { Link } from "react-router-dom";
const ProfilePopUp = ({ selectedUser, onlineUsers }) => {
    const popUp = useRef(null);
    console.log("see", selectedUser)

    const {  addFriend, removeFriend } = useChatStore(); 
    const [createGroup, setCreateGroup] = useState(false)
    const [friendId, setFriendId] = useState("");
    const { contextSafe } = useGSAP();
    const { setStreamMode, setStartStreaming, getSpecificStream, setStreamYoutube, streamData } = useStreamStore();
    const [History, setHistory] = useState(true)

    function getYouTubeId(url) {
        try {
            const parsed = new URL(url);
            if (parsed.hostname === "youtu.be") {
                return parsed.pathname.slice(1); // after "/"
            }
            if (parsed.hostname.includes("youtube.com")) {
                return new URLSearchParams(parsed.search).get("v");
            }
            return null;
        } catch (e) {
            return null;
        }
    }
    const closeAnimation = contextSafe(() => {
        const boxDiv = document.getElementById('boxDiv')
        gsap.to(popUp.current, {
            scale: "0"
        })

        setCreateGroup(false)

        setTimeout(() => {
            let tl = gsap.timeline({ paused: true })
            const backDiv = document.getElementById('backDiv')
            tl.to(backDiv, {
                opacity: 0
            })
            tl.to(backDiv, {
                display: "none"
            })
            tl.play()
            gsap.to(boxDiv, {
                display: "none"
            })
        }, 100);
    })

    const openAnimation = contextSafe(() => {
        const backDiv = document.getElementById('backDiv')
        const boxDiv = document.getElementById('boxDiv')
        gsap.to(backDiv, {
            display: "block"
        })
        gsap.to(boxDiv, {
            display: "flex"
        })
        gsap.to(popUp.current, {
            display: "block",
            scale: "1"
        })
        gsap.to(backDiv, {
            opacity: 0.7
        })
    })

    const handleAddFriend = () => {
        addFriend(friendId);
    }

    return (
        <>

            <div onClick={openAnimation} className="flex items-center cursor-pointer gap-3">
                {/* Avatar */}
                <div className="avatar">
                    <div className="size-10 rounded-full relative">
                        <img loading="blur" src={selectedUser?.name ? selectedUser?.profilePic || "/group.png" : selectedUser?.profilePic || "/avatar.png"} alt={selectedUser?.fullName} />
                    </div>
                </div>

                {/* User info */}
                <div>
                    <h3 className="font-medium">{selectedUser?.fullName || selectedUser?.name}</h3>
                    <p className="text-sm text-base-content/70">
                        {onlineUsers.includes(selectedUser?._id) ? "Online" : "Offline"}
                    </p>
                </div>
            </div>
            <div id='boxDiv' className='fixed inset-0 hidden justify-center items-center p-2 sm:p-4 z-[9999]'>
                <div id='backDiv' className='bg-black hidden opacity-0 fixed inset-0 z-[100] '>
                </div>
                <div ref={popUp} className='relative scale-50 border border-white hidden rounded-md h-[92vh] w-[96vw] max-w-6xl bg-base-100 z-[101] overflow-hidden'>
                    <button className='absolute right-3 top-3 w-8 h-8 flex items-center justify-center bg-base-100 text-sm rounded-md z-[102] border border-base-300' onClick={() => {
                        closeAnimation()
                    }}>
                        <X />
                    </button>
                    <section className='flex flex-col lg:flex-row gap-5 p-4 sm:p-6 lg:p-8 h-full overflow-y-auto'>
                        <div className='flex flex-col gap-8 justify-around items-center w-full lg:flex-1 min-w-0'>
                            <div className='flex flex-col sm:flex-row gap-6 sm:gap-8 w-full items-center sm:items-start' >

                                <div className='flex flex-col gap-3'>

                                    <div className="avatar">
                                        <div className=" rounded-full relative w-36 sm:w-40">
                                            <img loading="blur" className="  rounded-full object-cover border-4 " src={selectedUser?.name ? selectedUser?.profilePic || "/group.png" : selectedUser?.profilePic || "/avatar.png"} alt={selectedUser?.fullName} />
                                        </div>
                                    </div>
                                    <button onClick={()=> removeFriend(selectedUser.email)} className='bg-red-700 px-1 py-2   font-bold text-white rounded-md '>Remove friend</button>
                                </div>


                                <div className="space-y-6 w-full">
                                    <div className="space-y-1.5">
                                        <div className="text-sm text-zinc-400 flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            {selectedUser?.fullName ? "Full Name" : "Group Name"}
                                        </div>
                                        <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{selectedUser?.fullName ? selectedUser.fullName : selectedUser?.name}</p>
                                    </div>

                                    {selectedUser?.fullName ? <div className="space-y-1.5">
                                        <div className="text-sm text-zinc-400 flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            Email Address
                                        </div>
                                        <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{selectedUser?.email}</p>
                                    </div> :


                                        <div className="space-y-1.5">
                                            <div className="text-sm text-zinc-400 flex items-center gap-2">
                                                Description
                                            </div>
                                            <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{selectedUser?.description}</p>
                                        </div>

                                    }

                                </div>
                            </div>
                            <div className='flex justify-center gap-3 items-center flex-col w-full'>
                                <div className="text-sm text-zinc-400 flex   items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Members
                                </div>
                                <div className='max-h-48 sm:max-h-64 overflow-y-auto flex flex-wrap justify-center gap-2 w-full'>

                                    {selectedUser?.membersInfo?.map(item => (
                                        <div key={item._id}>
                                            <button
                                                className={`
              w-full p-3 flex items-center gap-3
              hover:bg-base-300 transition-colors
            `}
                                            >
                                                <div className="relative mx-auto lg:mx-0">
                                                    <img loading="blur"
                                                        src={item.fullName !== undefined ? item.profilePic || "/group.png" : item.profilePic || "/avatar.png"}
                                                        alt={item.fullName}
                                                        className="size-12 object-cover rounded-full brightness-95"
                                                    />
                                                    <h1>{item.fullName}</h1>
                                                </div >
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </ div>
                        </div>

                        <div className='flex flex-col gap-3 w-full lg:flex-1 min-w-0'>
                            <h1 className="text-sm text-zinc-400 flex items-center gap-2"><HistoryIcon className='w-4 h-4' /> History</h1>

                            {History && (
                                <ol tabIndex={0} onBlur={() => setHistory(false)} className="bg-base-300 border border-white rounded-md w-full h-[18rem] sm:h-[20rem] lg:h-full overflow-y-scroll p-3 sm:p-4 flex flex-col gap-3 shadow-md shadow-black ">
                                    {streamData?.allStream?.data?.length == 0 && <div className='w-full text-center flex justify-center items-center h-full'>No History</div>}
                                    {streamData?.allStream?.data && [...streamData?.allStream?.data].reverse().map((data, idx) => (
                                        <li onClick={() => {
                                            getSpecificStream(data?._id).then(() => { data?.streamInfo.type === "youtube" ? navigate("/stream/youtube-player") : navigate("/stream/file") }
                                            )

                                        }} key={idx} className='flex flex-col sm:flex-row p-2 bg-base-200 hover:bg-base-100 cursor-pointer rounded-md gap-4'>
                                            {/* Example conditional rendering */}
                                            {data?.streamInfo.type === "youtube" ? (
                                                <img className='w-full sm:w-[7rem] h-40 sm:h-[5rem] object-cover rounded'
                                                    src={`https://img.youtube.com/vi/${getYouTubeId(data?.streamInfo.url)}/hqdefault.jpg`}
                                                    alt="YouTube thumbnail"
                                                />
                                            ) : (
                                                <img className='w-full sm:w-[7rem] h-40 sm:h-[5rem] object-cover rounded'
                                                    src="https://assets.monica.im/tools-web/_next/static/media/pdf2word.99a03821.png"
                                                    alt=""
                                                />
                                            )}
                                            <div className='flex flex-col gap-2 '>

                                                <h1 className='text-xl text-content font-bold'> {data?.streamInfo.title}</h1>
                                                <h2 className='truncate'> {data?.streamInfo.description}</h2>
                                                <div className='flex  gap-4'>

                                                    <h2 className='flex gap-2'>
                                                        <img className='w-8 inline rounded-full' src={data?.senderInfo.profilePic} alt="" />
                                                        {data?.senderInfo.fullName}
                                                    </h2>
                                                </div>
                                                <h2 className='truncate text-sm'> <span className='font-bold'>Date: </span>{data?.createdAt.slice(0, 10)}</h2>
                                                <h2 className='truncate text-sm'> <span className='font-bold'>Time: </span>{data?.createdAt.slice(11, 16)}</h2>
                                            </div>


                                        </li>
                                    ))

                                    }
                                </ol>
                            )}
                        </div>

                    </section>

                </div>
            </div>
        </>
    )
}

export default ProfilePopUp
