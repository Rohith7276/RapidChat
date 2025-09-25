import React, { useState } from "react";

const TextToSpeech = ( ) => {
  const [text, setText] = useState(""); 

  const speak = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.pitch = 1;
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Your browser does not support speech synthesis.");
    }
  };

  return (
    <div className="p-4 border rounded-xl shadow-md mt-4">
      <h2 className="text-lg font-bold mb-2">🗣️ Text to Voice</h2>
      <textarea
        className="w-full border rounded-lg p-2 mb-2"
        rows="3"
        placeholder="Enter text here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={speak}
        className="px-4 py-2 bg-green-500 text-white rounded-lg"
      >
        Speak
      </button>
    </div>
  );
};

export default TextToSpeech;
