


import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI, Type } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { summary, clientName } = await req.json() as { summary: string, clientName: string };
        if (!summary || !clientName) {
            return { status: 400, jsonBody: { error: "'summary' and 'clientName' are required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `You are a Senior Account Manager. Based on the following business review summary for a client, suggest a list of actionable items for both the "leader" (your company's side) and the "client". Your output must be a single JSON object with two keys: "leaderActions" and "clientActions", where each key holds an array of 2-3 short, actionable strings. The entire response must be a single, valid, raw JSON object. Do not include any text before or after the JSON object. Do not use markdown formatting like \`\`\`json.`;
        const userPrompt = `Client Name: "${clientName}"\n\nReview Summary: "${summary}"`;
        
        const schema = {
            type: Type.OBJECT,
            properties: {
                leaderActions: { type: Type.ARRAY, items: { type: Type.STRING } },
                clientActions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['leaderActions', 'clientActions']
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const suggestions = JSON.parse(response.text);

        return {
            status: 200,
            jsonBody: suggestions,
        };

    } catch (error) {
        context.error('Error in suggestReviewActions function:', error);
        return { status: 500, jsonBody: { error: 'An internal error occurred.', details: (error as Error).message } };
    }
};

export default httpTrigger;