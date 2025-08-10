


import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI, Type } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { query, contextData } = await req.json() as { query: string, contextData: any };

        if (!query || !contextData) {
            return { status: 400, jsonBody: { error: "Bad Request: 'query' and 'contextData' are required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });

        const schema = {
            type: Type.OBJECT,
            properties: {
                action: { type: Type.STRING, enum: ['navigate', 'answer', 'clarify'] },
                view: { type: Type.STRING, enum: ['dashboard', 'accounts', 'team', 'tasks', 'leaderboard', 'my-week', 'knowledge-center', 'performance', 'reports'], description: "The view to navigate to. Required if action is 'navigate'." },
                filter: { type: Type.OBJECT, description: "A JSON object representing filters for the view. Keys can be 'status', 'priority', 'assigneeId', etc. To filter for a client by name, use the client ID in the filter, e.g., {'clientId': 'c123'}" },
                itemId: { type: Type.STRING, description: "A specific item ID to preselect if found." },
                text: { type: Type.STRING, description: "A text response for the user if the action is 'answer' or 'clarify'." },
            },
            required: ['action']
        };

        const systemInstruction = `You are a helpful AI navigator for a project management app called Solvo Core. Your job is to understand a user's natural language query and translate it into a structured JSON command.
- Analyze the user's query and the provided data context (clients, team members, tasks).
- Your primary goal is to determine if the user wants to navigate to a specific view with filters. If so, set action to 'navigate' and provide the 'view' and a 'filter' object. You can also provide an 'itemId' if a specific one is found.
- If the query is a question that can be answered from the data, set action to 'answer' and provide the answer in the 'text' field.
- If the query is ambiguous, set action to 'clarify' and ask a clarifying question in the 'text' field.
- The 'filter' object keys must match the data properties (e.g., 'status', 'priority', 'assigneeId', 'clientId').
- When filtering by name for a client or team member, find the corresponding ID from the context and use that in the filter (e.g., 'clientId': 'c123').
- You must always respond with a valid JSON object matching the provided schema.`;

        const userPrompt = `USER_QUERY: "${query}"\n\nDATA_CONTEXT: ${JSON.stringify(contextData)}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: schema
            }
        });
        
        let command = JSON.parse(response.text);
        
        // Ensure text is provided for answer/clarify actions for robustness
        if ((command.action === 'answer' || command.action === 'clarify') && !command.text) {
            command.text = "I found some information but couldn't formulate a clear answer. Could you rephrase your question?";
        }

        return { status: 200, jsonBody: { command } };

    } catch (error) {
        context.error('Error in conversationalSearch function:', error);
        return { status: 500, jsonBody: { error: 'An internal error occurred.', details: (error as Error).message } };
    }
};

export default httpTrigger;