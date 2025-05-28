import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useChatStore } from '../store/useChatStore';

const ElevenLabsTTS = () => {
    const [loading, setLoading] = useState(false);
    const apiKey = "sk_e46179ab53fa4992082f8524eb57ec8a5702cb3613cb025e"; // Replace with your real API key
    const voiceId = 'EXAVITQu4vr4xnSDxMaL'; // Rachel's default voice
    const { setVideoAiTalking } = useChatStore()
    const handleSpeak = async (text) => {

        if (!text) return;

        setLoading(true);
        try {
            const response = await axios.post(
                `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
                {
                    text,
                    model_id: 'eleven_monolingual_v1',
                    voice_settings: {
                        stability: 1,
                        similarity_boost: 1,
                    },
                },
                {
                    headers: {
                        'xi-api-key': apiKey,
                        'Content-Type': 'application/json',
                        'Accept': 'audio/mpeg',
                    },
                    responseType: 'blob',
                }
            );
console.log(response.data)
            const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            setVideoAiTalking(true)

            audio.play();
            audio.onended = () => {
                setVideoAiTalking(false)
            }
        } catch (error) {
            console.error('Error with ElevenLabs API:', error);
            alert('Something went wrong. Check your API key or request limit.');
        } finally {


            setLoading(false);
        }
    };
    const { sendAiText, textToTalk } = useChatStore()

    useEffect(() => {
        handleSpeak(textToTalk)
    }, [textToTalk])

    return (
        <div className=" ">
         hai
        </div>
    );
};

export default ElevenLabsTTS;
