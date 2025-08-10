

import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI, Type } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { member, tasks, clients } = await req.json() as { member: any, tasks: any[], clients: any[] };

        if (!member || !tasks || !clients) {
            return { status: 400, jsonBody: { error: "Bad Request: 'member', 'tasks', and 'clients' are required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        
        const systemInstruction = `You are an executive coach preparing a manager for a 1-on-1 session. Your response must be a valid JSON object with three keys: "praise" (array of strings), "growth" (array of strings), and "questions" (array of strings).
- Analyze the employee's data: performance, tasks (especially overdue/completed), and client status.
- "praise": Identify 2-3 specific, positive achievements or behaviors.
- "growth": Identify 2-3 specific, constructive areas for discussion or improvement.
- "questions": Provide 2-3 open-ended questions the manager can ask to facilitate a productive conversation based on the praise and growth points.
- The entire response must be a single, valid, raw JSON object. Do not include any text before or after the JSON object. Do not use markdown formatting.`;

        const userPrompt = `DATA: ${JSON.stringify({ member, tasks, clients })}\n\nGenerate the pre-session briefing.`;
        
        const schema = {
            type: Type.OBJECT,
            properties: {
                praise: { type: Type.ARRAY, items: { type: Type.STRING } },
                growth: { type: Type.ARRAY, items: { type: Type.STRING } },
                questions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['praise', 'growth', 'questions']
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const result = JSON.parse(response.text);

        return { status: 200, jsonBody: result };

    } catch (error) {
        context.error('Error in generateCoachingPrep function:', error);
        return { status: 500, jsonBody: { error: 'An internal error occurred.', details: (error as Error).message } };
    }
};

export default httpTrigger;
