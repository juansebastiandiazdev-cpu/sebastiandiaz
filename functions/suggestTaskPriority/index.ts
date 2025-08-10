

import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI, Type } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { tasks } = await req.json() as { tasks: any[] };
        if (!tasks || !Array.isArray(tasks)) {
            return { status: 400, jsonBody: { error: "'tasks' array is required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `As a project management expert for Solvo, analyze this list of tasks and return a JSON object with a key "topThree" which is an array of the top 3 most urgent and important task IDs. Prioritize tasks that are Overdue, have high priority, are for 'Critical' status clients, or have imminent due dates.`;
        const userPrompt = `Tasks: ${JSON.stringify(tasks)}`;
        
        const schema = {
            type: Type.OBJECT,
            properties: {
                topThree: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING
                    }
                }
            },
            required: ['topThree']
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });
        
        const result = JSON.parse(response.text);

        return {
            status: 200,
            jsonBody: { topThree: result.topThree },
        };

    } catch (error) {
        context.error('Error in suggestTaskPriority function:', error);
        return { status: 500, jsonBody: { error: 'An internal error occurred.', details: (error as Error).message } };
    }
};

export default httpTrigger;