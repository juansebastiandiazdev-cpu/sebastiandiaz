

import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI, Type } from "@google/genai";

type AiCommand = 'suggest_tags' | 'improve' | 'draft_article';

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { command, text, title } = await req.json() as { command: AiCommand, text: string, title: string };
        if (!command || !text) {
            return { status: 400, jsonBody: { error: "'command' and 'text' are required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        
        let response;
        let systemInstruction;
        let userPrompt;

        switch (command) {
            case 'suggest_tags':
                systemInstruction = `Analyze the following article content and title. Based on the text, suggest an appropriate category and a list of relevant tags. The category should be a short, path-like string (e.g., "Policies/HR" or "Workflows"). Provide a maximum of 4 tags. Your output must be a valid JSON object with two keys: "category" (string) and "tags" (array of strings). The entire response must be a single, valid, raw JSON object. Do not include any text before or after the JSON object. Do not use markdown formatting.`;
                userPrompt = `TITLE: "${title}"\n\nCONTENT: "${text}"`;
                const schema = {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['category', 'tags']
                };
                response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: userPrompt,
                    config: { systemInstruction, responseMimeType: 'application/json', responseSchema: schema }
                });
                
                const suggestions = JSON.parse(response.text);
                return { status: 200, jsonBody: { suggestions } };

            case 'improve':
                systemInstruction = `You are a professional editor. Rewrite the following text to improve its clarity, grammar, and professional tone. Do not add any commentary. Only return the improved text.`;
                userPrompt = `TEXT: "${text}"`;
                response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: userPrompt,
                    config: { systemInstruction }
                });
                return { status: 200, jsonBody: { improvedText: response.text } };

            case 'draft_article':
                systemInstruction = `You are a knowledge base author. Write a well-structured article in Markdown format based on the following prompt. Use headings, lists, and bold text to create a clear and readable document.`;
                userPrompt = `PROMPT: "${text}"`;
                response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: userPrompt,
                    config: { systemInstruction }
                });
                return { status: 200, jsonBody: { improvedText: response.text } };
            
            default:
                return { status: 400, jsonBody: { error: "Invalid command." } };
        }

    } catch (error) {
        context.error('Error in aiWriter function:', error);
        return { status: 500, jsonBody: { error: 'An internal error occurred.', details: (error as Error).message } };
    }
};

export default httpTrigger;