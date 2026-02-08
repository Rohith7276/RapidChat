import React, { useRef, useState } from 'react'
import { ChevronRight, HistoryIcon, Mail, Users, X } from 'lucide-react';
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
    const { logout, authUser } = useAuthStore();
    const { addFriend } = useChatStore()
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
            <div id='boxDiv' className='absolute    top-0 left-0 hidden justify-center h-screen w-screen  items-center'>
                <div id='backDiv' className='bg-black hidden opacity-0 absolute top-0 left-0 w-screen h-screen z-[100] '>
                </div>
                <div ref={popUp} className='scale-50 border border-white hidden rounded-l-md   h-[70%] w-[60%]   bg-base-100  z-[101]'>
                    <button className='ml-[-1.34rem] w-[1.33rem] absolute bg-base-100 text-sm h-10 mt-5 rounded-l-sm z-[99]' onClick={() => {
                        closeAnimation()
                    }}>
                        <X />
                    </button>
                    <section className='flex gap-5 p-[2rem] justify-around'>
                        <div className='flex flex-col gap-3'>

                            <div className="avatar">
                                <div className=" rounded-full relative w-[10rem]">
                                    <img loading="blur" className="  rounded-full object-cover border-4 " src={selectedUser?.name ? selectedUser?.profilePic || "/group.png" : selectedUser?.profilePic || "/avatar.png"} alt={selectedUser?.fullName} />
                                </div>
                            </div>
                            <button className='bg-red-700 btn   font-bold text-white rounded-md '>Remove friend</button>
                        </div>


                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <div className="text-sm text-zinc-400 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Full Name
                                </div>
                                <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{selectedUser?.fullName}</p>
                            </div>

                            <div className="space-y-1.5">
                                <div className="text-sm text-zinc-400 flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Email Address
                                </div>
                                <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{selectedUser?.email}</p>
                            </div>
                        </div>

                        <div className='flex flex-col gap-3 '>
                             <h1 className="text-sm text-zinc-400 flex items-center gap-2"><HistoryIcon className='w-4 h-4'/> History</h1>

                            {History && (
                                <ol tabIndex={0} onBlur={() => setHistory(false)} className="bg-base-300 border border-white  rounded-md w-[25rem] h-[20rem] overflow-y-scroll  p-4 flex flex-col gap-3     shadow-md shadow-black ">
                                    {streamData?.allStream?.data?.length == 0 && <div className='w-full text-center flex justify-center items-center h-full'>No History</div>}
                                    {streamData?.allStream?.data && [...streamData?.allStream?.data].reverse().map((data, idx) => (
                                        <li onClick={() => {
                                            getSpecificStream(data?._id).then(() => { data?.streamInfo.type === "youtube" ? navigate("/stream/youtube-player") : navigate("/stream/file") }
                                            )

                                        }} key={idx} className='flex p-2 bg-base-200 hover:bg-base-100 cursor-pointer rounded-md gap-4'>
                                            {/* Example conditional rendering */}
                                            {data?.streamInfo.type === "youtube" ? (
                                                <img className='w-[7rem] h-[5rem]'
                                                    src={`https://img.youtube.com/vi/${getYouTubeId(data?.streamInfo.url)}/hqdefault.jpg`}
                                                    alt="YouTube thumbnail"
                                                />
                                            ) : (
                                                <img className='w-[7rem] h-[5rem]'
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
