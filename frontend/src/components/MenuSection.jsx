import React, { useRef, useState } from 'react'
import { ChevronRight, UserPlus, Users } from 'lucide-react';
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react";
import { Menu } from 'lucide-react';
import { LogOut, Settings, User } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import CreateGroup from './CreateGroup.jsx';
import { useChatStore } from '../store/useChatStore';
const MenuSection = () => {
    const menuDiv = useRef(null);
    const { logout, authUser } = useAuthStore();
    const { addFriend } = useChatStore()
    const [createGroup, setCreateGroup] = useState(false)
    const [friendId, setFriendId] = useState("");
    const [showAddFriendInput, setShowAddFriendInput] = useState(false);
    const { contextSafe } = useGSAP();

    const closeAnimation = contextSafe(() => {
        gsap.to(menuDiv.current, {
            x: "0vw"
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
        }, 100);
    })

    const openAnimation = contextSafe(() => {
        const backDiv = document.getElementById('backDiv')
        gsap.to(backDiv, {
            display: "block"
        })
        gsap.to(menuDiv.current, {
            x: "-30vw"
        })
        gsap.to(backDiv, {
            opacity: 0.7
        })
    })

    const handleAddFriend = () => {
        addFriend(friendId);
        setFriendId("");
        setShowAddFriendInput(false);
    }

    return (
        <>
            <button onClick={openAnimation}>
                <Menu />
            </button>
            <div className=''>
                <div id='backDiv' className='bg-black hidden opacity-0 absolute top-0 left-0 w-screen h-screen z-[100] '>
                </div>
                <div ref={menuDiv} className='w-[20vw] mr-[-30vw] h-screen rounded-l-md right-0 fixed bg-base-300 top-0 z-[101]'>
                    <button className='ml-[-1.34rem] w-[1.33rem] absolute bg-base-100 text-sm h-10 mt-5 rounded-l-sm z-[99]' onClick={() => {
                        closeAnimation();setShowAddFriendInput(false)
                    }}>
                        <ChevronRight />
                    </button>
                    <div>
                        <div className='px-5 pt-5 rounded-sm flex justify-center items-center overflow-hidden max-h-[50vh] max-w-full'>
                            <img src={authUser?.profilePic} alt="" /> 
                        </div>
                        <h1 className='w-full text-center mt-2 text-2xl lg:text-3xl font-bold'>{authUser?.fullName}</h1>
                    </div>
                    <div className="flex items-center  px-4 py-5 gap-4 flex-col">

                        {authUser && (
                            <   >
                                <div className='w-full relative'>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddFriendInput((prev) => !prev)}
                                        className='flex btn btn-sm gap-2 h-fit p-3 w-full    justify-center'
                                    >
                                        <UserPlus className="size-5" /> 
                                        <span className='hidden sm:inline'>Add friend</span>
                                    </button>

                                    <div className='hidden sm:flex w-full lg:mb-3 lg:flex-row flex-col gap-2 justify-around mt-3'>
                                        <input
                                            type="text"
                                            placeholder='Enter email'
                                            className='bg-base-content text-base-300 px-2   rounded-md w-full'
                                            onChange={(e) => setFriendId(e.target.value)}
                                            value={friendId}
                                        />
                                        <button onClick={handleAddFriend} className='bg-primary text-base-300 font-bold px-3 py-1 rounded-md'>Add</button>
                                    </div>

                                    {showAddFriendInput && (
                                        <div className='sm:hidden w-[11rem] absolute   right-14 top-full mt-[-3rem] z-[200] rounded-lg border border-base-300 bg-base-100 p-3 shadow-lg'>
                                            <div className='flex flex-col gap-2'>
                                                <input
                                                    type="text"
                                                    placeholder='Enter email'
                                                    className='bg-white px-2 py-2 text-black rounded-md w-full'
                                                    onChange={(e) => setFriendId(e.target.value)}
                                                    value={friendId}
                                                />
                                                <div className='flex gap-2'>
                                                    <button onClick={handleAddFriend} className='bg-primary text-base-300 font-bold px-3 py-2 rounded-md flex-1'>Add</button>
                                                     
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <Link to={"/profile"} onClick={() => {
                                    closeAnimation()
                                }} className={`btn btn-sm gap-2 w-full`}>
                                    <User className="size-5" />
                                    <span className="hidden sm:inline">Profile</span>
                                </Link>

                                <Link onClick={() => {
                                    closeAnimation()
                                }}
                                    to={"/create-group"}
                                    className={`btn btn-sm w-full gap-2 transition-colors`}
                                >
                                    <Users className="w-4 h-4" />

                                    <span className="hidden sm:inline">Create Group</span>
                                </Link>

                                <Link onClick={() => {
                                    closeAnimation()
                                }}
                                    to={"/settings"}
                                    className={`btn btn-sm w-full gap-2 transition-colors`}
                                >
                                    <Settings className="w-4 h-4" />
                                    <span className="hidden sm:inline">Settings</span>
                                </Link>
                                <button onClick={() => {
                                    closeAnimation()
                                    logout()
                                }} className="flex gap-2 items-center"  >
                                    <LogOut className="size-5" />
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            </ >
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default MenuSection
