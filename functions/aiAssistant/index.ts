import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI, Tool, Type, Content } from "@google/genai";

const tools: Tool[] = [
    {
        functionDeclarations: [
            {
                name: "create_task",
                description: "Creates a new task and assigns it to a team member.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING, description: "The title of the task." },
                      description: { type: Type.STRING, description: "A detailed description of the task." },
                      assigneeName: { type: Type.STRING, description: "The name of the team member to assign the task to. Must be a name from the provided team members list." },
                      clientName: { type: Type.STRING, description: "The name of the client this task is for. Must be a name from the provided clients list." },
                      priority: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Urgent'], description: "The priority of the task. Defaults to 'Medium'." },
                      dueDate: { type: Type.STRING, description: "The due date for the task in YYYY-MM-DD format. If not provided, it will be set to tomorrow." }
                    },
                    required: ["title", "assigneeName"]
                }
            },
            {
                name: "update_task_status",
                description: "Updates the status of an existing task using its ID.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                      taskId: { type: Type.STRING, description: "The ID of the task to update. Must be an ID from the task list." },
                      newStatus: { type: Type.STRING, enum: ['Pending', 'In Progress', 'Overdue', 'Completed'], description: "The new status for the task." }
                    },
                    required: ["taskId", "newStatus"]
                }
            },
            {
                name: "update_client_status",
                description: "Updates the health status of an existing client using its ID.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                      clientId: { type: Type.STRING, description: "The ID of the client to update. Must be an ID from the client list." },
                      newStatus: { type: Type.STRING, enum: ['Healthy', 'At-Risk', 'Critical'], description: "The new health status for the client." }
                    },
                    required: ["clientId", "newStatus"]
                }
            },
            {
                name: "send_shout_out",
                description: "Sends a recognition message (shout-out) to a team member.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                      toTeamMemberName: { type: Type.STRING, description: "The name of the team member to receive the shout-out. Must be a name from the team members list." },
                      message: { type: Type.STRING, description: "The content of the shout-out message." }
                    },
                    required: ["toTeamMemberName", "message"]
                }
            },
            {
                name: "add_comment_to_article",
                description: "Adds a comment to a knowledge center article.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                      articleTitle: { type: Type.STRING, description: "The title of the article to add a comment to. Must be an exact match from the articles list." },
                      commentContent: { type: Type.STRING, description: "The text of the comment to add." }
                    },
                    required: ["articleTitle", "commentContent"]
                }
            },
            {
                name: "update_client_notes",
                description: "Updates the main 'notes' field for a specific client. Use this for general status updates, important context, or summaries.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        clientName: { type: Type.STRING, description: "The name of the client to update. Must be an exact or close match from the client list." },
                        newNotes: { type: Type.STRING, description: "The new content for the notes field. This will overwrite the existing notes." }
                    },
                    required: ["clientName", "newNotes"]
                }
            },
            {
                name: "add_client_pulse_log",
                description: "Adds a new entry to a client's pulse log, recording an interaction or event. This appends to the log, it does not overwrite.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        clientName: { type: Type.STRING, description: "The name of the client to update. Must be an exact or close match from the client list." },
                        pulseType: { type: Type.STRING, enum: ['Meeting', 'Call', 'Email', 'Note'], description: "The type of interaction." },
                        pulseNotes: { type: Type.STRING, description: "The detailed notes for this pulse log entry." }
                    },
                    required: ["clientName", "pulseType", "pulseNotes"]
                }
            },
            {
                name: "update_team_member_notes",
                description: "Updates the 'homeOffice.notes' field for a specific team member. This is for administrative notes, like HO status, performance remarks, or other relevant context.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        teamMemberName: { type: Type.STRING, description: "The name of the team member to update. Must be an exact or close match from the team members list." },
                        newNotes: { type: Type.STRING, description: "The new content for the administrative notes field. This will overwrite existing notes." }
                    },
                    required: ["teamMemberName", "newNotes"]
                }
            }
        ]
    }
];

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { prompt: userPrompt, context: contextData, history: chatHistory } = await req.json() as { prompt: string, context: any, history: Content[] };

        if (!userPrompt || !contextData) {
            return { status: 400, jsonBody: { error: "'prompt' and 'context' are required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        
        const systemInstruction = `You are Solvo Core's AI Assistant, an expert operations analyst. Your purpose is to help managers and team members get quick insights from their operational data and perform actions. 
- Use the provided data context to answer questions or use the provided tools to perform actions. 
- You can now update context for clients and team members using tools like 'update_client_notes', 'add_client_pulse_log', and 'update_team_member_notes'.
- To provide more thoughtful and accurate responses, deeply consider the provided context. For clients, look at their status, notes, and recent pulse log entries. For team members, consider their role and performance data. Synthesize this information before answering or acting.
- When asked to draft an email, generate the full text of the email within your response, formatted with 'Subject:' and 'Body:'. Do not use a tool for this.
- The current user is ${contextData.currentUser.name} (id: ${contextData.currentUser.id}). Today's date is ${new Date().toLocaleDateString()}.
- When using a tool to update an entity (like a task or client), find the entity in the DATA_CONTEXT by name and use its 'id' for the tool call's 'taskId' or 'clientId' argument. This is more reliable than using the name.
- Be concise and professional.
- For navigation, you can provide a special action link. The format MUST be exactly: ACTION_LINK[<button_text>|<view_name>|<filter_json>|<item_id>].
- The following is the application data context, in JSON format. Use it to answer the user's request. DATA_CONTEXT: ${JSON.stringify({clients: contextData.clients, tasks: contextData.tasks, team: contextData.teamMembers, articles: contextData.articles})}`;

        const contents: Content[] = [ ...(chatHistory || []), { role: 'user', parts: [{ text: userPrompt }] }];
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: { systemInstruction, tools },
        });
        
        const functionCalls = response.functionCalls;

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            return { status: 200, jsonBody: { type: 'tool_call', call } };
        }
        
        return { status: 200, jsonBody: { type: 'text', text: response.text } };

    } catch (error) {
        context.error('Error in aiAssistant function:', error);
        return { status: 500, jsonBody: { type: 'error', error: 'An internal error occurred.', details: (error as Error).message } };
    }
};

export default httpTrigger;