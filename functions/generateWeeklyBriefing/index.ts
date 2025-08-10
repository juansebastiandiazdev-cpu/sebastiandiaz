

import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { tasks } = await req.json() as { tasks: any[] };
        if (!tasks) {
            return { status: 400, jsonBody: { error: "'tasks' array is required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        const tasksForPrompt = tasks.map((t: any) => ({
            title: t.title,
            priority: t.priority,
            goal: t.weeklyGoalCategory || 'general',
            status: t.status,
        }));

        const systemPrompt = `Analyze the following list of weekly tasks for a user. Provide a short, encouraging, and insightful summary (the "Weekly Briefing") of what their week looks like.
        - Address the user directly in a friendly but professional tone.
        - Highlight the most common goal category.
        - Mention the number of high-priority tasks.
        - Keep the entire summary under 60 words.
        - Do not use markdown headings. Only use bolding for emphasis.`;
        
        const userPrompt = `Tasks: ${JSON.stringify(tasksForPrompt)}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
            }
        });

        return {
            status: 200,
            jsonBody: { briefing: response.text },
        };

    } catch (error) {
        context.error('Error in generateWeeklyBriefing function:', error);
        return { status: 500, jsonBody: { error: 'An internal error occurred.', details: (error as Error).message } };
    }
};

export default httpTrigger;