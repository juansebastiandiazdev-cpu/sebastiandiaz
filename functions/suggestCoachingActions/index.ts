

import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI, Type } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { summary, role } = await req.json() as { summary: string, role: string };

        if (!role || !summary) {
            return { status: 400, jsonBody: { error: "Bad Request: 'role' and 'summary' are required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        
        const systemPrompt = `Based on the following coaching session summary for an employee with the provided role, suggest a list of actionable items for both the leader (manager) and the employee. Your output must be a single JSON object with two keys: "leaderActions" and "employeeActions", where each key holds an array of 2-3 strings. Example: {"leaderActions": ["Provide more detailed feedback on weekly reports."], "employeeActions": ["Block out focus time for report writing."]}`;
        const userPrompt = `Role: "${role}"\n\nSession Summary: "${summary}"`;
        
        const schema = {
            type: Type.OBJECT,
            properties: {
                leaderActions: { type: Type.ARRAY, items: { type: Type.STRING } },
                employeeActions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['leaderActions', 'employeeActions']
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
        context.error('Error in suggestCoachingActions function:', error);
        return { status: 500, jsonBody: { error: 'An internal error occurred.', details: (error as Error).message } };
    }
};

export default httpTrigger;