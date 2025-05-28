import React, { useState, useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import TextToSpeech from './TextToSpeech';

const SpeechToText = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [error, setError] = useState(null);
  const { sendAiText, textToTalk, videoAiTalking } = useChatStore()

  useEffect(() => {
    // Check if browser supports the Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();

    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onresult = (event) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        }
      }

      if (finalTranscript && finalTranscript.toLowerCase().includes("rapid")) {
        setTranscript(finalTranscript);
        console.log("Final Transcript:", finalTranscript);
        // if(finalTranscript.toLowerCase().includes("rapid"))
        sendAiText(finalTranscript);
        setTimeout(() => {
          setTranscript("")
        }, 3000);
      }
    };

    recognitionInstance.onerror = (event) => {
      setError(`Error occurred in recognition: ${event.error}`);
      setIsListening(false);
    };

    recognitionInstance.onend = () => {
      if (isListening) {
console.log('listen')
        recognitionInstance.start();
      }
    };

    setRecognition(recognitionInstance);
    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, []);
  
  useEffect(() => {
    toggleListening()
    
  }, [recognition])
  




  const toggleListening = () => {
    if (!recognition) return;

    // if (isListening) {
    //   recognition.stop();
    //   setIsListening(false);
    // } else {
    setError(null);
    window.speechSynthesis.cancel();

    recognition.start();
    setIsListening(true);
    // }
  };


  return (
    <div className="p-4 max-w-md mx-auto  rounded-lg">

      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-4 flex justify-center space-x-2">
 


      </div>

      <div className="relative   flex overflow-hidden pt-5 w-full flex-col h-[28vw]   justify-start items-center">
        {videoAiTalking && <div className="absolute flex rounded-full mt-[-1.8rem] overflow-hidden w-[20rem] pt-5 h-[50vh] ">
          <img className="z-[10] absolute 0 w-[20rem] h-[20rem]" src="/talking.gif" alt="talkingGif" />
        </div>}
        <div className="rounded-full z-[20] overflow-hidden   ">
          <img className="w-[19rem] h-[19rem]" src="https://imgcdn.stablediffusionweb.com/2024/10/20/a11e6805-65f5-4402-bef9-891ab7347104.jpg" alt="RapidAi" />
        </div>
        <div
          className="h-fit w-fit   z-[100] mt-[-2rem] border text-base-content rounded resize-none  "
        >
          {transcript}
        </div>
        <TextToSpeech text={transcript}   /> 
      </div>
    </div>
  );
};

export default SpeechToText;