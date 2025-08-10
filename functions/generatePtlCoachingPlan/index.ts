


import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI, Type } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { ptlReport } = await req.json() as { ptlReport: any };

        if (!ptlReport) {
            return { status: 400, jsonBody: { error: "Bad Request: 'ptlReport' is required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        
        const systemInstruction = `You are an expert HR Business Partner and Manager creating a coaching plan to address an employee's turnover risk. Your output must be a valid JSON object with three keys: "summary" (string), "leaderActions" (array of strings), and "employeeActions" (array of strings).
- "summary": Write a 2-3 paragraph coaching session summary based on the PTL (Potential Turnover Likelihood) factors. This summary should frame the conversation constructively. It should acknowledge strengths and gently introduce the areas of concern derived from the negative factors.
- "leaderActions": Suggest 2-3 specific, actionable items for the manager to support the employee.
- "employeeActions": Suggest 2-3 specific, actionable items for the employee to work on.
- The entire response must be a single, valid, raw JSON object. Do not use markdown formatting.`;
        const userPrompt = `PTL_REPORT: ${JSON.stringify(ptlReport)}\n\nGenerate the coaching plan.`;
        
        const schema = {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING },
                leaderActions: { type: Type.ARRAY, items: { type: Type.STRING } },
                employeeActions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['summary', 'leaderActions', 'employeeActions']
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

        const plan = JSON.parse(response.text);

        return { status: 200, jsonBody: plan };

    } catch (error) {
        context.error('Error in generatePtlCoachingPlan function:', error);
        return { status: 500, jsonBody: { error: 'An internal error occurred.', details: (error as Error).message } };
    }
};

export default httpTrigger;