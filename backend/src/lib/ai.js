// pages/api/chat.js
import Groq from "groq-sdk";



export default async function getResponse(input) {
    const groq = new Groq();
    const chatCompletion = await groq.chat.completions.create({
        "messages": [
            {
                "role": "user",
                "content": input
            }
        ],
        "model": "llama3-8b-8192",
        "temperature": 1,
        "max_tokens": 1024,
        "top_p": 1,
        "stream": true,
        "stop": null
    });
    var response = ""
    for await (const chunk of chatCompletion) {
        response += chunk.choices[0]?.delta?.content || "";
    } 

    return response;
}
