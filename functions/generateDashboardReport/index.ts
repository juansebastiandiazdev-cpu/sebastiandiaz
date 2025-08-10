

import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI, Type } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { kpiData, clientContext } = await req.json() as any;

        if (!kpiData || !clientContext) {
            return { status: 400, jsonBody: { error: "Bad Request: 'kpiData' and 'clientContext' are required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        
        // Parallel requests
        const kpiSystemInstruction = `You are a professional business analyst. Analyze the provided KPI data and return a JSON object with two keys: "summary" (string) and "highlights" (an array of 2-3 strings). The "summary" should be a 2-4 sentence client-facing overview of the weekly performance. The "highlights" should be short, bullet-point-style strings for key movements. The entire response must be a single, valid, raw JSON object. Do not include any text before or after the JSON object. Do not use markdown formatting.`;
        const kpiUserPrompt = `KPI_DATA: ${JSON.stringify(kpiData)}\n\nGenerate the performance report JSON.`;
        const kpiSchema = {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING },
                highlights: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['summary', 'highlights']
        };
        const kpiSummaryPromise = ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: kpiUserPrompt,
            config: { systemInstruction: kpiSystemInstruction, responseMimeType: 'application/json', responseSchema: kpiSchema }
        });

        const healthSystemInstruction = `You are a Senior Client Manager. Write a concise health summary for a client based on the provided data. The summary should be 2-3 sentences and in plain text. Mention risks and strengths based on status, notes, tasks, and KPIs.`;
        const healthUserPrompt = `DATA: ${JSON.stringify(clientContext)}\n\nGenerate the health summary.`;
        const healthSummaryPromise = ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: healthUserPrompt,
            config: { systemInstruction: healthSystemInstruction }
        });
        
        const [kpiResultResponse, healthResult] = await Promise.all([kpiSummaryPromise, healthSummaryPromise]);
        
        const kpiResult = JSON.parse(kpiResultResponse.text);

        return {
            status: 200,
            jsonBody: {
                kpiSummary: kpiResult.summary,
                highlights: kpiResult.highlights,
                healthSummary: healthResult.text
            },
        };

    } catch (error) {
        context.error('Error in generateDashboardReport function:', error);
        return {
            status: 500,
            jsonBody: { error: 'An internal error occurred.', details: (error as Error).message },
        };
    }
};

export default httpTrigger;