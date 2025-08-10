

import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI, Type } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { title, description } = await req.json() as { title: string, description: string };
        if (!title) {
            return { status: 400, jsonBody: { error: "'title' is required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `You are an expert project manager. Your output must be a valid JSON object with a single key "subtasks" which contains an array of objects, where each object has a "text" property with the sub-task description. The entire response must be a single, valid, raw JSON object. Do not include any text before or after the JSON object. Do not use markdown formatting.`;
        const userPrompt = `Based on the task title "${title}" and description "${description}", suggest a list of actionable sub-tasks.`;
        
        const schema = {
            type: Type.OBJECT,
            properties: {
                subtasks: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING }
                        },
                        required: ['text']
                    }
                }
            },
            required: ['subtasks']
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });
        
        const suggested = JSON.parse(response.text);

        return {
            status: 200,
            jsonBody: { subtasks: suggested.subtasks },
        };

    } catch (error) {
        context.error('Error in suggestSubtasks function:', error);
        return { status: 500, jsonBody: { error: 'An internal error occurred.', details: (error as Error).message } };
    }
};

export default httpTrigger;