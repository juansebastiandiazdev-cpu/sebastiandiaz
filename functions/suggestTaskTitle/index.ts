

import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { title } = await req.json() as { title: string };
        if (!title) {
            return { status: 400, jsonBody: { error: "'title' is required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `You are a productivity assistant for a company called Solvo. Your goal is to make task titles more specific, actionable, and clear. Do not add any commentary or quotation marks, just provide the improved title string.`;
        const userPrompt = `Improve this task title: "${title}"`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
            }
        });

        const newTitle = response.text.trim().replace(/"/g, '');

        return {
            status: 200,
            jsonBody: { newTitle },
        };

    } catch (error) {
        context.error('Error in suggestTaskTitle function:', error);
        return { status: 500, jsonBody: { error: 'An internal error occurred.', details: (error as Error).message } };
    }
};

export default httpTrigger;