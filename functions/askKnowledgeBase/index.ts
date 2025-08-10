


import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI, Type } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { question, articles } = await req.json() as { question: string, articles: any[] };

        if (!question || !articles) {
            return { status: 400, jsonBody: { error: "Bad Request: 'question' and 'articles' are required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });

        const articlesForPrompt = articles.map(a => ({ id: a.id, title: a.title, category: a.category, content: a.content }));
        
        const systemInstruction = `You are a helpful AI assistant for Solvo Core's knowledge base. Your task is to answer the user's question based *only* on the provided article data.
- Analyze the JSON data of articles thoroughly.
- Your output MUST be a valid JSON object with two keys: "answer" (string) and "sourceIds" (array of strings).
- If you can answer the question, provide a concise, direct answer in the "answer" field and list the IDs of the articles you used in "sourceIds".
- If the articles do not contain the answer, the "answer" field must contain the single sentence: "I could not find an answer to your question in the knowledge base." and "sourceIds" should be an empty array.
- Do not make up information. Stick strictly to the provided text.
- The entire response must be a single, valid, raw JSON object. Do not include any text before or after the JSON object. Do not use markdown formatting like \`\`\`json.`;
        const fullPrompt = `ARTICLES_DATA: ${JSON.stringify(articlesForPrompt)}\n\nUSER_QUESTION: "${question}"`;
        
        const schema = {
            type: Type.OBJECT,
            properties: {
                answer: { type: Type.STRING },
                sourceIds: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['answer', 'sourceIds']
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: schema
            }
        });

        const result = JSON.parse(response.text);
        
        return {
            status: 200,
            jsonBody: { answer: result.answer, sourceIds: result.sourceIds },
        };

    } catch (error) {
        context.error('Error in askKnowledgeBase function:', error);
        return {
            status: 500,
            jsonBody: { error: 'An internal error occurred while asking the knowledge base.', details: (error as Error).message },
        };
    }
};

export default httpTrigger;