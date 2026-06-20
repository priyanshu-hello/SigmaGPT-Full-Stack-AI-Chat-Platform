import "dotenv/config";

const getOpenAIAPIResponse = async (message) => {
    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY.length === 0) {
        return "I can't reply internally because the OpenRouter API key is missing. Please add your key to the Backend .env file.";
    }

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": "http://localhost:5173", // Required by OpenRouter
            "X-Title": "SigmaGPT", // Optional by OpenRouter
        },
        body: JSON.stringify({
            model: "google/gemini-2.0-flash-exp:free", // Superior quality (Flash 2.0)
            messages: [{
                role: "system",
                content: "You are a restricted coding assistant. Strict Output Rules:\n1. ALL code, INCLUDING imports (e.g., #include, import), headers, function signatures, and template definitions, MUST be inside a Markdown code block.\n2. NEVER write code as plain text.\n3. ALWAYS specify the language tag (e.g., ```cpp, ```java) after the backticks. Do not let the language be auto-detected."
            }, {
                role: "user",
                content: message + "\n\n[SYSTEM: STRICTLY ENCLOSE ALL IMPORTS, SIGNATURES, AND LOGIC IN A ```language CODE BLOCK. DO NOT WRITE CODE IN PLAIN TEXT.]"
            }]
        })
    };

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", options);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("OpenRouter API Error (Switching to Fallback):", response.status, errorData);
            // Fallback to Demo Mode
            return `[BUSY/OFFLINE] The AI service is currently busy or unavailable (${response.status}).\n\nHere is a simulated response so you can continue testing the UI:\n"I received: ${message}"`;
        }

        const data = await response.json();
        return data.choices[0].message.content; //reply
    } catch (err) {
        console.error("Fetch Error (Switching to Fallback):", err);
        return `[NETWORK ERROR] Could not reach AI service. Simulated response:\n"I received: ${message}"`;
    }
}

export default getOpenAIAPIResponse;