// pages/api/chat.js
import Groq from "groq-sdk";



export default async function getResponse(input) {
    try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const chatCompletion = await groq.chat.completions.create({
            "messages": [
                {
                    "role": "user",
                    "content": input
                }
            ],
            // "model": "llama3-8b-8192",
            model: "openai/gpt-oss-20b",
            "temperature": 1,
            "max_tokens": 1,
            "top_p": 1,
            "stream": true,
            "stop": null
        });
        var response = ""
        console.log(chatCompletion)
        for await (const chunk of chatCompletion) {
            response += chunk.choices[0]?.delta?.content || "";
        }

        return response;
    }
    catch (e) {
        console.log("Error in getting response from ai",e)
        return e
    }
}
