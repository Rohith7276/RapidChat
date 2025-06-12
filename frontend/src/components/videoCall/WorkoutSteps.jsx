import React, { useEffect, useRef, useState } from 'react';


const elevenLabsApiKey = "sk_e46179ab53fa4992082f8524eb57ec8a5702cb3613cb025e";
const voiceId = 'EXAVITQu4vr4xnSDxMaL'; // You can use "Rachel" or another

const WorkoutSteps = (id) => {
    const steps = id.id.steps_to_follow; 
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const audioRef = useRef(null);

  const speakStep = async (text) => {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": elevenLabsApiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    const audioBlob = await response.blob();
    const audioURL = URL.createObjectURL(audioBlob);
    audioRef.current.src = audioURL;
    audioRef.current.play();
  };

  useEffect(() => {
    if (currentStepIndex < steps.length) {
      speakStep(steps[currentStepIndex]);
      const timer = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, 7000); // delay per step (adjust if needed)
      return () => clearTimeout(timer);
    }
  }, [currentStepIndex]);

  return (
    <div className="w-full max-w-3xl mx-auto text-center p-4">
      <video width="100%" controls autoPlay>
        <source src={id.id.video_link} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="mt-6 p-4 text-xl font-semibold bg-gray-100 rounded shadow">
        {steps[currentStepIndex] ?? "You're all set!"}
      </div>

      <audio ref={audioRef} />
    </div>
  );
};

export default WorkoutSteps;
