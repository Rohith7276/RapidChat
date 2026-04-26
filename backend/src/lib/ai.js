import Groq from "groq-sdk";



export default async function getResponse(input, options = {}) {
    try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const messages = Array.isArray(input)
            ? input
            : [
                {
                    role: "user",
                    content: String(input),
                },
            ];

        const chatCompletion = await groq.chat.completions.create({
            messages,
            model: options.model || "openai/gpt-oss-20b",
            temperature: options.temperature ?? 0.7,
            max_tokens: options.max_tokens ?? 1200,
            top_p: options.top_p ?? 1,
            stream: false,
        });

        return chatCompletion.choices?.[0]?.message?.content?.trim() || "";
    }
    catch (e) {
        console.log("Error in getting response from ai",e)
        return e
    }
}
