


import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI, Type } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { clientContext } = await req.json() as { clientContext: any };
        if (!clientContext) {
            return { status: 400, jsonBody: { error: "Bad Request: 'clientContext' is required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });

        const systemInstruction = `You are a Senior Client Strategist. Your task is to provide 2-3 concise, actionable recommendations for a client based on their data. The output must be a valid JSON object with a single key "actions", which is an array of strings.
- Analyze the client's status, notes, and open/overdue tasks.
- If the client is 'Critical' or 'At-Risk', prioritize actions that address the core issues mentioned in the notes or indicated by overdue tasks.
- If the client is 'Healthy', suggest proactive actions for growth or continued success.
- Each action should be a clear, single sentence.
- Example: {"actions": ["Prioritize completing the 'Finalize Q3 Report' task to address client concerns.", "Schedule a proactive check-in call to discuss the upcoming project."]}
- The entire response must be a single, valid, raw JSON object. Do not use markdown formatting.`;

        const userPrompt = `CLIENT_DATA: ${JSON.stringify(clientContext)}\n\nGenerate the strategic action items.`;
        
        const schema = {
            type: Type.OBJECT,
            properties: {
                actions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            },
            required: ['actions']
        };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        
        const result = JSON.parse(response.text);

        return { status: 200, jsonBody: { actions: result.actions } };

    } catch (error) {
        context.error('Error in generateReportActionItems function:', error);
        return {
            status: 500,
            jsonBody: { error: 'An internal error occurred.', details: (error as Error).message },
        };
    }
};

export default httpTrigger;