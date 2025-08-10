

import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { clientContext } = await req.json() as any;

        if (!clientContext) {
            return { status: 400, jsonBody: { error: "Bad Request: 'clientContext' is required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        
        const systemInstruction = `You are a Senior Client Manager. Your task is to write a concise health summary for a client based on the provided data. The summary should be 2-3 sentences and in plain text.
- Analyze the client's current status, notes, recent pulse log entries, open tasks, and tracked KPI performance.
- Synthesize these points into a clear, professional summary.
- Start with the client's current status.
- Mention key risks (e.g., overdue tasks, negative pulse log entries, underperforming KPIs).
- Mention key strengths (e.g., healthy status, positive notes, good KPI performance).
- Example: "The client is currently At-Risk. While KPI performance is stable, there are several high-priority overdue tasks and a recent pulse log entry mentioned communication issues. Immediate attention to these tasks is recommended."
        `;
        const userPrompt = `DATA: ${JSON.stringify(clientContext)}\n\nGenerate the health summary.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction
            }
        });

        return {
            status: 200,
            jsonBody: { summary: response.text },
        };

    } catch (error) {
        context.error('Error in generateClientHealthSummary function:', error);
        return {
            status: 500,
            jsonBody: { error: 'An internal error occurred.', details: (error as Error).message },
        };
    }
};

export default httpTrigger;