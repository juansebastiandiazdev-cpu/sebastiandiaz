


import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI, Type } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { context: contextData } = await req.json() as { context: any };

        if (!contextData) {
            return { status: 400, jsonBody: { error: "Bad Request: 'context' is required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `You are a proactive Senior Operations Analyst for Solvo Core. Your task is to analyze the provided application data and identify the top 2-3 most critical, actionable insights for the current user. Focus on identifying risks, opportunities, or important reminders.
- Analyze the JSON data context thoroughly.
- Return a JSON object with a single key "insights" which is an array of objects.
- Each insight object must have three keys: "text" (string), "type" (enum: "risk", "opportunity", "info"), and "urgency" (enum: "low", "medium", "high").
- Example: {"insights": [{"text": "Client 'XYZ' is At-Risk and has 3 overdue tasks.", "type": "risk", "urgency": "high"}]}
- If there are no critical insights, return an empty array for the "insights" key.
- Be concise. Each insight "text" should be a single sentence.
- The entire response must be a single, valid, raw JSON object. Do not include any text before or after the JSON object. Do not use markdown formatting like \`\`\`json.`;
        const userPrompt = `SYSTEM_DATA: ${JSON.stringify(contextData)}\n\nGenerate insights based on the provided data.`;

        const schema = {
            type: Type.OBJECT,
            properties: {
                insights: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ["risk", "opportunity", "info"] },
                            urgency: { type: Type.STRING, enum: ["low", "medium", "high"] }
                        },
                        required: ['text', 'type', 'urgency']
                    }
                }
            },
            required: ['insights']
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: { systemInstruction, responseMimeType: "application/json", responseSchema: schema }
        });

        const insights = JSON.parse(response.text);

        return { status: 200, jsonBody: insights };
    } catch (error) {
        context.error('Error in generateDashboardInsights function:', error);
        return { status: 500, jsonBody: { error: 'An internal error occurred.', details: (error as Error).message } };
    }
};

export default httpTrigger;