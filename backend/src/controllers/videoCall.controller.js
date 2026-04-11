import fs from "fs";
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export const transcribe = async (req, res) => {
  try {
    console.log("dekie", req.file)
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
  
    const response = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-large-v3-turbo",
      prompt: "Transcribe the audio",
      response_format: "verbose_json",
      timestamp_granularities: ["word", "segment"],
      language: "en",
      temperature: 0.0,
    });

    // fs.unlinkSync(filePath);

    const text = response?.text; 
    console.log(text)
    res.json({ text: text || "" });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};


