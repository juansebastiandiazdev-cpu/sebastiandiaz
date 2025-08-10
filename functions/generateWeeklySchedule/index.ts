


import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI, Type } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { tasksToSchedule, existingSchedule } = await req.json() as { tasksToSchedule: any[], existingSchedule: any[] };
        if (!tasksToSchedule || !Array.isArray(tasksToSchedule)) {
            return { status: 400, jsonBody: { error: "'tasksToSchedule' array is required." } };
        }
        
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        
        const tasksForPrompt = tasksToSchedule.map((t: any) => ({
            taskId: t.id, title: t.title, priority: t.priority,
        }));
        
        const existingForPrompt = (existingSchedule || []).map(t => ({ day: t.day, startMinutes: t.startMinutes, durationMinutes: t.durationMinutes }));

        const systemPrompt = `You are an expert project manager creating a balanced weekly schedule. Constraints: 5-day week (Mon-Fri), 9:00 AM to 5:00 PM, with a 1-hour lunch break from 12:00 PM to 1:00 PM (do not schedule tasks during this time). Task durations by priority: Urgent: 120 mins, High: 90 mins, Medium: 60 mins, Low: 30 mins. Goal: Distribute the new tasks evenly into the available time slots, avoiding overloading any single day and respecting the already scheduled tasks. Your output MUST be a valid JSON object with two keys: "scheduledTasks" and "overflowTasks". - "scheduledTasks": Array of objects, each with "taskId" (string), "dayIndex" (number, 0=Mon), "startMinutes" (number, minutes from midnight, e.g., 9:00 AM is 540), and "durationMinutes" (number, based on priority). - "overflowTasks": Array of taskIds (string) for tasks that could not fit. The entire response must be a single, valid, raw JSON object. Do not include any text before or after the JSON object. Do not use markdown formatting.`;
        const userPrompt = `TASKS_TO_SCHEDULE: ${JSON.stringify(tasksForPrompt)}\n\nEXISTING_SCHEDULED_ITEMS: ${JSON.stringify(existingForPrompt)}\n\nPlace the new tasks into the available slots.`;
        
        const schema = {
            type: Type.OBJECT,
            properties: {
                scheduledTasks: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            taskId: { type: Type.STRING },
                            dayIndex: { type: Type.INTEGER },
                            startMinutes: { type: Type.INTEGER },
                            durationMinutes: { type: Type.INTEGER }
                        },
                        required: ['taskId', 'dayIndex', 'startMinutes', 'durationMinutes']
                    }
                },
                overflowTasks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            },
            required: ['scheduledTasks', 'overflowTasks']
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: { systemInstruction: systemPrompt, responseMimeType: 'application/json', responseSchema: schema }
        });
        
        const result = JSON.parse(response.text);

        return { status: 200, jsonBody: { scheduledTasks: result.scheduledTasks, overflowTasks: result.overflowTasks } };

    } catch (error) {
        context.error('Error in generateWeeklySchedule function:', error);
        return { status: 500, jsonBody: { error: 'An internal error occurred.', details: (error as Error).message } };
    }
};

export default httpTrigger;