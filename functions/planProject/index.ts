


import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI, Type } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { goal, clientContext, teamContext, endDate } = await req.json() as { goal: string, clientContext?: any, teamContext?: any[], endDate?: string };

        if (!goal) {
            return { status: 400, jsonBody: { error: "Bad Request: 'goal' is required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        
        const systemInstruction = `You are an expert Project Manager for Solvo. Your task is to break down a high-level project goal into a list of actionable tasks, returning a valid JSON object.
- The output MUST be a JSON object with a single key "tasks", containing an array of task objects.
- Each task object should contain: "title" (string), "description" (string), "priority" ('High', 'Medium', 'Low'), "assigneeId" (string), "dueDate" (string, YYYY-MM-DD), and "subTasks" (array of objects with "text": string, "completed": boolean).
- Use the provided context to make smart decisions:
- If a client is provided, assume the project is for them.
- If a team context is provided, choose the best assignee for each task based on their role and distribute the work. If no role is available, distribute evenly.
- If an end date is provided, sequence the task due dates logically to meet the deadline.
- Break down complex steps into 2-3 sub-tasks.
- Ensure the JSON is valid and well-formed.
- Example task: {"title": "Schedule kick-off call", "description": "...", "priority": "High", "assigneeId": "emilio.alvear", "dueDate": "2024-07-01", "subTasks": [{"text": "...", "completed": false}]}
- The entire response must be a single, valid, raw JSON object. Do not use markdown formatting.`;
        
        const userPrompt = `PROJECT_GOAL: "${goal}"\n\nEND_DATE: ${endDate || 'Not specified'}\n\nCLIENT_CONTEXT: ${JSON.stringify(clientContext)}\n\nTEAM_CONTEXT: ${JSON.stringify(teamContext)}\n\nGenerate the project plan.`;
        
        const schema = {
            type: Type.OBJECT,
            properties: {
                tasks: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            priority: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Urgent'] },
                            assigneeId: { type: Type.STRING },
                            dueDate: { type: Type.STRING },
                            subTasks: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        text: { type: Type.STRING },
                                        completed: { type: Type.BOOLEAN }
                                    },
                                    required: ['text', 'completed']
                                }
                            }
                        },
                        required: ['title', 'description', 'priority', 'assigneeId', 'dueDate', 'subTasks']
                    }
                }
            },
            required: ['tasks']
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
        context.error('Error in planProject function:', error);
        return {
            status: 500,
            jsonBody: { error: 'An internal error occurred.', details: (error as Error).message },
        };
    }
};

export default httpTrigger;