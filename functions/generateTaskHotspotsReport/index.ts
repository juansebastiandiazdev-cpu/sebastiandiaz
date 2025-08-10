


import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI, Type } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { tasks } = await req.json() as { tasks: any[] };
        if (!tasks) {
            return { status: 400, jsonBody: { error: "Bad Request: 'tasks' is required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });

        const openTasks = tasks.filter(t => t.status !== 'Completed');
        const overdueTasks = openTasks.filter(t => t.status === 'Overdue').map(t => ({ id: t.id, title: t.title, assignedTo: t.assignedTo }));
        const highPriorityTasks = openTasks.filter(t => t.priority === 'High' || t.priority === 'Urgent').map(t => ({ id: t.id, title: t.title, assignedTo: t.assignedTo }));

        const systemInstruction = `You are an Operations Manager analyzing task data. Based on the list of open tasks, write a 1-2 sentence summary identifying potential bottlenecks or areas of concern. For example, if one person has many overdue tasks, mention that. Return plain text only.`;
        const userPrompt = `TASK_DATA: ${JSON.stringify(openTasks)}\n\nGenerate the summary.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: { systemInstruction },
        });

        return {
            status: 200,
            jsonBody: {
                summary: response.text,
                overdueTasks,
                highPriorityTasks
            },
        };

    } catch (error) {
        context.error('Error in generateTaskHotspotsReport function:', error);
        return { status: 500, jsonBody: { error: 'An internal error occurred.', details: (error as Error).message } };
    }
};

export default httpTrigger;