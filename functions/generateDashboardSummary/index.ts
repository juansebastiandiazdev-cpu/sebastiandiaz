

import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { currentKpiData, previousKpiData } = await req.json() as { currentKpiData: any[], previousKpiData: any[] };

        if (!currentKpiData) {
            return { status: 400, jsonBody: { error: "'currentKpiData' array is required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        
        const systemInstruction = `You are a professional business analyst writing a weekly performance summary for a client. Your tone should be professional, encouraging, and clear.
- Analyze the provided current and previous week's KPI data. Each KPI object includes 'name', 'target', and 'actual'.
- Write a concise summary (2-4 sentences).
- Start by acknowledging the overall performance for the current week.
- Highlight 1-2 key successes where targets were met or exceeded.
- If applicable, briefly and constructively mention 1-2 areas with opportunities for improvement.
- Compare current vs. previous week's data to identify and mention significant trends (e.g., "a strong improvement in X," or "a slight dip in Y that we are monitoring").
- Do not use Markdown formatting. Return plain text only.`;

        const userPrompt = `CURRENT_WEEK_KPI_DATA: ${JSON.stringify(currentKpiData)}\nPREVIOUS_WEEK_KPI_DATA: ${JSON.stringify(previousKpiData)}\n\nGenerate the client-facing summary.`;
        
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
        context.error('Error in generateDashboardSummary function:', error);
        return {
            status: 500,
            jsonBody: { error: 'An internal error occurred.', details: (error as Error).message },
        };
    }
};

export default httpTrigger;