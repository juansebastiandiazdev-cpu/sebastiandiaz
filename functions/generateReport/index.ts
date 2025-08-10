

import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { request: userRequest, context: contextData } = await req.json() as { request: string, context: any };

        if (!userRequest || !contextData) {
            return {
                status: 400,
                jsonBody: { error: "Bad Request: 'request' and 'context' are required." },
            };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `You are a Senior Business Analyst for Solvo Core. Your task is to generate insightful reports based on the provided data and user requests. Analyze the JSON data context thoroughly. Structure your report clearly using Markdown (headings, bold text, lists). Provide actionable insights and summaries, not just raw data. Be professional, data-driven, and concise.`;
        const userPrompt = `SYSTEM_DATA: ${JSON.stringify(contextData)}\n\nUSER_REQUEST: "${userRequest}"\n\nGenerate the report based on the request and the provided data.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        return {
            status: 200,
            jsonBody: { report: response.text },
        };

    } catch (error) {
        context.error('Error in generateReport function:', error);
        return {
            status: 500,
            jsonBody: { error: 'An internal error occurred.', details: (error as Error).message },
        };
    }
};

export default httpTrigger;