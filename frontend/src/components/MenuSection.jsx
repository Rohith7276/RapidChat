import React, { useRef, useState } from 'react'
import { ChevronRight, Users } from 'lucide-react';
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react";
import { Menu } from 'lucide-react';
import { LogOut, Settings, User } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import CreateGroup from './createGroup';
const MenuSection = () => {
    const menuDiv = useRef(null);
    const { logout, authUser } = useAuthStore();
    const [createGroup, setCreateGroup] = useState(false)

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
                        closeAnimation()
                    }}>
                        <ChevronRight />
                    </button>
                    <div>
                        <div className='px-5 pt-5 rounded-sm flex justify-center items-center overflow-hidden max-h-[50vh] max-w-full'>
                            <img src={authUser?.profilePic} alt="" />
                        </div>
                        <h1 className='w-full text-center text-3xl font-bold'>{authUser?.fullName}</h1>
                    </div>
                    <div className="flex items-center  px-4 py-5 gap-4 flex-col">

                        {authUser && (
                            <>
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
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default MenuSection
