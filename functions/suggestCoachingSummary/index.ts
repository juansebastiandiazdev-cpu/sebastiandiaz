

import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { member, tasks, clients, preSessionContext } = await req.json() as { member: any, tasks: any[], clients: any[], preSessionContext?: string };

        if (!member || !tasks || !clients) {
            return { status: 400, jsonBody: { error: "Bad Request: 'member', 'tasks', and 'clients' are required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        
        const systemInstruction = `You are a Senior Manager drafting a coaching feedforward session summary.
- The tone should be constructive, supportive, and forward-looking.
- Analyze the provided data about the team member: their role, performance score, recent tasks (especially overdue ones), and the status of their assigned clients.
- If pre-session context is provided by the manager, it should be the primary focus of the summary.
- Based on the data, write a 2-3 paragraph summary for a coaching session.
- The summary should identify at least one key strength to praise and one area for development.
- The summary should be written as if you are documenting the key points of a conversation.
- Do not add any commentary. Only return the summary text.`;

        let userPrompt = `DATA: ${JSON.stringify({ member, tasks, clients })}\n\n`;
        if (preSessionContext) {
            userPrompt += `MANAGER'S PRE-SESSION CONTEXT: "${preSessionContext}"\n\n`;
        }
        userPrompt += `Draft the coaching session summary.`;

        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        return {
            status: 200,
            jsonBody: { summary: response.text },
        };

    } catch (error) {
        context.error('Error in suggestCoachingSummary function:', error);
        return {
            status: 500,
            jsonBody: { error: 'An internal error occurred.', details: (error as Error).message },
        };
    }
};

export default httpTrigger;
