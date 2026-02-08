import React, { useEffect,useRef, useState } from 'react';

const TypedText = ({ texts, speed = 100 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const line = useRef(null)
  useEffect(() => {
    if (texts.data == undefined || texts?.data?.length === 0 || texts?.length === 0) return;
    line.current.style.display = "inline"
    const currentText = texts?.data[textIndex];
    const interval = setInterval(() => {
      setDisplayedText(prev => prev + currentText.charAt(charIndex));
      setCharIndex(prevCharIndex => {
        const nextCharIndex = prevCharIndex + 1;
        if (nextCharIndex === currentText.length) {
          setTimeout(() => {
            setDisplayedText('');
            setCharIndex(0);
            setTextIndex((prevTextIndex) => (prevTextIndex + 1) % texts?.data.length);
          }, 1000);
          clearInterval(interval);
        }
        return nextCharIndex;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [texts, textIndex, charIndex, speed]);

  return (
    <p className="text-[2rem] leading-relaxed">
      {displayedText}
      <span ref={line} className="animate-pulse hidden">|</span>
    </p>
  );
};

export default TypedText;
