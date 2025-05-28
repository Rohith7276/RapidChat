
import React, { useEffect, useState, useRef } from 'react'
import { useGSAP } from "@gsap/react";
import { gsap } from 'gsap';

import plans from '../../public/plans.json'
import SentenceSlideshow from '../components/SentenceSlideShow';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);


const Home = () => {
  const { contextSafe } = useGSAP();
  useEffect(() => {

    const animation = contextSafe(() => {
      gsap.to(".homeScreenImg", {
        duration: 5,
        y: -30,
        ease: 'power2.out',
      });
      gsap.to(".homeText", {
        duration: 5,
        opacity: 1,
        y: -30,
        ease: 'power2.out',
      });
      // gsap.to(".homeScreenImg", {
      //     duration: 5,
      //     opacity: 0,
      //     y: -30,
      //     ease: 'power2.out',
      //   });

      ScrollTrigger.create({
        trigger: "a",
        start: "top top",
        end: "bottom top",
        scrub: 1,
        markers: true,
        onEnter: () => {
          gsap.to(".lefttoright", {
            duration: 5,
            // opacity: 1,
            x: 30,
            ease: 'power2.out',
          });
          gsap.to(".righttoleft", {
            duration: 5,
            // opacity: 1,
            x: -30,
            ease: 'power2.out',
          });
        },
        // onLeaveBack: () => {
        //   gsap.to(".righttoleft", {
        //     duration: 5,
        //     opacity: 0,
        //     y: -30,
        //     ease: 'power2.out',
        //   });
        //   gsap.to(".lefttoright", {
        //     duration: 5,
        //     opacity: 0,
        //     y: -30,
        //     ease: 'power2.out',
        //   });
        // },
      });

    });


    animation();
  }, []);

  return (
    <>
      <div className="relative h-screen bg-gray-100">
        <div className="h-screen overflow-hidden relative">
          <img
            src="https://images.unsplash.com/photo-1554344728-77cf90d9ed26?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Workout Background"
            className="w-screen absolute homeScreenImg h-fit mt-[4rem]"
          />
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b homeText opacity-0 from-base-100/40 via-base-100/85 to-base-100 mt-[4rem] text-content">
          <h1 className="text-center text-[5rem] font-bold mt-[37vh] text-context">
            Welcome to RapidFit
          </h1>
          <SentenceSlideshow />
        </div>
      </div>

      <div className="flex flex-col gap-36 my-24 mt-12">
        <div className='flex gap-36 w-full justify-center'>


          <a
            href="/community"
            className="flex lefttoright items-center justify-center cursor-pointer w-[29rem] h-[22rem] transition-all ease-in-out hover:scale-105 bg-gray-200 rounded shadow-md bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://plus.unsplash.com/premium_photo-1663036263525-3059e0c47b96?q=80&w=2092&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            }}
          >
            <div className="bg-base-100/50 w-full h-full flex items-center text-content flex-col justify-center rounded">
              <h2 className="text-xl font-bold text-content">Community Hub</h2>
              <p className="text-sm text-content">
                Join our community and share
              </p>
            </div>
          </a>
          <div>
            <h1 className="text-3xl font-bold text-center">
              Engage with like-minded people now!
            </h1>
            <p></p>
          </div>
        </div>
        <div className='flex gap-36 w-full justify-center'>
        <div>
        <h1 className="text-3xl font-bold text-center">
        Engage with like-minded people now!
        </h1>
        <p></p>
      </div>
          <a
            href="/workout"
            className="flex righttoleft items-center self-end justify-center cursor-pointer w-[29rem] h-[22rem] transition-all ease-in-out hover:scale-105 bg-gray-200 rounded shadow-md bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            }}
          >
            <div className="bg-base-100/50 w-full h-full flex items-center text-content flex-col justify-center rounded">
              <h2 className="text-xl font-bold text-content">Start Workout</h2>
              <p className="text-sm text-content">
                Begin your personalized workout plan today.
              </p>
            </div>
          </a>

        </div>
        <div className='flex gap-36 w-full justify-center'>
          <a
            href="/food"
            className="flex lefttoright items-center justify-center cursor-pointer w-[29rem] h-[22rem] transition-all ease-in-out hover:scale-105 bg-gray-200 rounded shadow-md bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://plus.unsplash.com/premium_photo-1663858367108-9150fe5ce9bd?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            }}
          >
            <div className="bg-base-100/50 w-full h-full flex items-center text-content flex-col justify-center rounded">
              <h2 className="text-xl font-bold text-content">Track Your Diet</h2>
              <p className="text-sm text-content">
                Monitor your meals and stay on track.
              </p>
            </div>
          </a>
          <div>
            <h1 className="text-3xl font-bold text-center">
              Engage with like-minded people now!
            </h1>
            <p></p>
          </div>
        </div>
      </div>

      <section className="mt-16 text-center">
        <h1 className="text-3xl font-bold">Start Your Workout Journey Today</h1>
        <p className="text-lg mt-4">
          Explore our plans and achieve your fitness goals with RapidFit.
        </p>
      </section>
    </>
  );
}

export default Home
