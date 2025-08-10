


import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI, Type } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { clients } = await req.json() as { clients: any[] };
        if (!clients) {
            return { status: 400, jsonBody: { error: "Bad Request: 'clients' is required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });

        const counts = clients.reduce((acc, client) => {
            if (client.status === 'Healthy') acc.healthy++;
            else if (client.status === 'At-Risk') acc.atRisk++;
            else if (client.status === 'Critical') acc.critical++;
            return acc;
        }, { healthy: 0, atRisk: 0, critical: 0 });

        const atRiskClients = clients.filter(c => c.status === 'At-Risk' || c.status === 'Critical').map(c => ({ name: c.name, status: c.status }));

        const systemInstruction = `You are a Senior Account Manager summarizing client portfolio health. Based on the list of at-risk and critical clients, write a 1-2 sentence summary identifying the key risks. If there are no at-risk clients, state that the portfolio is healthy. Return plain text only.`;
        const userPrompt = `AT_RISK_CLIENTS: ${JSON.stringify(atRiskClients)}\n\nGenerate the summary.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: { systemInstruction },
        });

        return {
            status: 200,
            jsonBody: {
                summary: response.text,
                counts
            },
        };

    } catch (error) {
        context.error('Error in generateClientHealthReport function:', error);
        return { status: 500, jsonBody: { error: 'An internal error occurred.', details: (error as Error).message } };
    }
};

export default httpTrigger;