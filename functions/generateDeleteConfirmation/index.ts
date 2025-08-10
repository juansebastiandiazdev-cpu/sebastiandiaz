

import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { type, name, taskCount } = await req.json() as { type: 'client' | 'team member', name: string, taskCount: number };
        if (!type || !name || typeof taskCount === 'undefined') {
            return { status: 400, jsonBody: { error: "'type', 'name', and 'taskCount' are required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        
        const systemInstruction = `You are a helpful UX writer. Your job is to create a clear and direct confirmation message for a deletion action. The user needs to understand the consequences.`;
        
        let userPrompt = `Create a confirmation message for deleting a ${type} named "${name}".`;

        if (type === 'client' && taskCount > 0) {
            userPrompt += ` This will also delete ${taskCount} associated task(s).`;
        } else if (type === 'team member' && taskCount > 0) {
            userPrompt += ` This will unassign ${taskCount} associated task(s).`;
        }
        userPrompt += " The message must start with 'Are you sure you want to' and end with 'This action cannot be undone.'";
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction,
            }
        });

        return {
            status: 200,
            jsonBody: { confirmationText: response.text.replace(/"/g, '') },
        };

    } catch (error) {
        context.error('Error in generateDeleteConfirmation function:', error);
        return { status: 500, jsonBody: { error: 'An internal error occurred.', details: (error as Error).message } };
    }
};

export default httpTrigger;