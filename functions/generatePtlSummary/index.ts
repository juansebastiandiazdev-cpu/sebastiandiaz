

import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { riskLevel, factors } = await req.json() as { riskLevel: string, factors: any[] };
        if (!riskLevel || !factors) {
            return { status: 400, jsonBody: { error: "'riskLevel' and 'factors' are required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        const userPrompt = `Analyze the following employee data to generate a concise, professional summary (max 3 sentences) about their turnover risk. Do not mention the risk score. Focus on the 'why'. For example, if performance is low and they are on critical accounts, mention that. If they are performing well with no negative factors, state that they appear to be a stable and valuable team member.
When analyzing factors, consider the context. For example, a low performance score for a new hire on a complex account might not be as severe. Mention any potential biases in your summary if relevant.\n\nData: ${JSON.stringify({ riskLevel, factors })}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
        });

        return {
            status: 200,
            jsonBody: { summary: response.text },
        };

    } catch (error) {
        context.error('Error in generatePtlSummary function:', error);
        return { status: 500, jsonBody: { error: 'An internal error occurred.', details: (error as Error).message } };
    }
};

export default httpTrigger;