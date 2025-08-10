


import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI, Type } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { teamMembers } = await req.json() as { teamMembers: any[] };
        if (!teamMembers) {
            return { status: 400, jsonBody: { error: "Bad Request: 'teamMembers' is required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });

        const sortedMembers = [...teamMembers].sort((a, b) => b.performanceScore - a.performanceScore);
        const topPerformers = sortedMembers.slice(0, 3).map(m => ({ id: m.id, name: m.name, performanceScore: m.performanceScore }));
        const needsSupport = sortedMembers.filter(m => m.performanceScore < 75).slice(0, 3).map(m => ({ id: m.id, name: m.name, performanceScore: m.performanceScore }));

        const systemInstruction = `You are a Senior Manager analyzing team performance data. Based on the provided list of team members, write a 1-2 sentence summary of the team's overall performance. Mention any standout high performers or if there's a general trend of solid performance. Return plain text only.`;
        const userPrompt = `TEAM_DATA: ${JSON.stringify(teamMembers.map(m => ({ name: m.name, performanceScore: m.performanceScore })))}\n\nGenerate the summary.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: { systemInstruction },
        });

        return {
            status: 200,
            jsonBody: {
                summary: response.text,
                topPerformers,
                needsSupport
            },
        };

    } catch (error) {
        context.error('Error in generateTeamPerformanceReport function:', error);
        return { status: 500, jsonBody: { error: 'An internal error occurred.', details: (error as Error).message } };
    }
};

export default httpTrigger;