import React, { useState, useRef, useEffect } from "react";

const Dictaphone = () => {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window && !recognitionRef.current) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";
    }

    const recognition = recognitionRef.current;
    if (!recognition) return;

    recognition.onresult = (event) => {
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
      setText(finalTranscript);
    };

    recognition.onend = () => {
      if (isListening) recognition.start();
    };

    if (isListening) {
      recognition.start();
    } else {
      recognition.stop();
      setTimeout(() => {
        speak();
      }, 1000);
    }

    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.stop();
    };
    // eslint-disable-next-line
  }, [isListening]);

  const startListening = () => setIsListening(true);
  const stopListening = () => setIsListening(false);

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
    <div className=" absolute z-10 ml-[10rem]  mt-10">
      <div className="p-6 border rounded-xl shadow-md mb-6 bg-white">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span role="img" aria-label="Text to Voice">🗣️</span> Text to Voice
        </h2>
        <textarea
          className="w-full border rounded-lg p-2 mb-4"
          rows="3"
          placeholder="Enter text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          onClick={speak}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg mb-4"
        >
          Speak
        </button>
        <div className="p-4 border rounded-xl shadow-md bg-gray-50">
          <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
            <span role="img" aria-label="Voice to Text">🎤</span> Voice to Text
          </h2>
          <p className="mb-4 text-gray-700">{transcript || "Say something..."}</p>
          {!isListening ? (
            <button
              onClick={startListening}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              Start Listening
            </button>
          ) : (
            <button
              onClick={stopListening}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
            >
              Stop Listening
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
 
export default Dictaphone;