


import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI, Type } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { riskScore, riskLevel, factors } = await req.json() as { riskScore: number, riskLevel: string, factors: any[] };
        if (typeof riskScore === 'undefined' || !riskLevel || !factors) {
            return { status: 400, jsonBody: { error: "'riskScore', 'riskLevel', and 'factors' are required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `You are a Senior Manager and HR Business Partner. Analyze the provided Potential Turnover Likelihood (PTL) data for an employee. Your response must be a valid JSON object with two keys: "analysis" (string) and "mitigation" (array of strings).
- "analysis": A 2-3 sentence paragraph explaining *why* the employee has this risk level. Connect the dots between the contributing factors. Be insightful and concise.
- "mitigation": An array of 2-3 specific, actionable strategies a manager can take to mitigate the identified turnover risk. These should be practical and tied to the factors.
- The entire response must be a single, valid, raw JSON object. Do not include any text before or after the JSON object. Do not use markdown formatting.`;
        
        const userPrompt = `DATA: ${JSON.stringify({ riskScore, riskLevel, factors })}`;
        
        const schema = {
            type: Type.OBJECT,
            properties: {
                analysis: { type: Type.STRING },
                mitigation: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['analysis', 'mitigation']
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

        const result = JSON.parse(response.text);

        return { status: 200, jsonBody: result };

    } catch (error) {
        context.error('Error in generatePtlAnalysis function:', error);
        return { status: 500, jsonBody: { error: 'An internal error occurred.', details: (error as Error).message } };
    }
};

export default httpTrigger;