import React, { useEffect, useState } from 'react';

const TypedText = ({ text, speed = 100 }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;

    const interval = setInterval(() => {
      setDisplayedText(prev => prev + text.charAt(index));
      index++;

      if (index === text.length) {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <p className="text-[5rem] leading-relaxed">
      {displayedText}
      <span className="animate-pulse">|</span>
    </p>
  );
};

export default TypedText;
