

import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { member, snapshots } = await req.json() as { member: any, snapshots: any[] };

        if (!member || !snapshots) {
            return {
                status: 400,
                jsonBody: { error: "Bad Request: 'member' and 'snapshots' are required." },
            };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `You are a Senior Manager writing a performance summary for a team member.
- Analyze the provided historical performance snapshots.
- Write a concise, professional, and constructive summary (3-5 paragraphs) in Markdown format.
- Identify overall performance trends (e.g., "consistent high-performer," "showing steady improvement," "recent dip in performance").
- Highlight specific strengths by mentioning KPIs where they consistently exceed goals.
- If applicable, identify areas for development by mentioning KPIs where performance is inconsistent or below target. Frame this constructively.
- Conclude with an encouraging closing statement.
- Address the summary to the manager reviewing the data, not the employee.`;

        const userPrompt = `MEMBER_DATA: ${JSON.stringify(member)}\nHISTORICAL_SNAPSHOTS: ${JSON.stringify(snapshots)}\n\nGenerate the performance summary.`;

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
        context.error('Error in generatePerformanceSummary function:', error);
        return {
            status: 500,
            jsonBody: { error: 'An internal error occurred.', details: (error as Error).message },
        };
    }
};

export default httpTrigger;