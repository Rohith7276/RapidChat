import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const sentences = [
  "Push yourself, no one else will.",
  "No excuses, just results.",
  "Train like a beast, look like a beauty.",
  "Don't wish for it, work for it.",
  "Stronger every day."
];

const SentenceSlideshow = () => {
  const [index, setIndex] = useState(0);
  const textRef = useRef();

  useEffect(() => {
    const animateText = () => {
      gsap.fromTo(
        textRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          onComplete: () => {
            gsap.to(textRef.current, {
              opacity: 0,
              y: -20,
              duration: 1,
              delay: 2,
              onComplete: () => {
                setIndex(prev => (prev + 1) % sentences.length);
              }
            });
          }
        }
      );
    };

    animateText();
  }, [index]);

  return (
    <div className="  w-full flex justify-center items-center bg- black text-context text-3xl h-[6rem] font-bold">
      <div ref={textRef}>{sentences[index]}</div>
    </div>
  );
};

export default SentenceSlideshow;
