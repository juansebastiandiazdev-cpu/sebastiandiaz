
import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { member, tasks, clients } = await req.json() as { member: any, tasks: any[], clients: any[] };

        if (!member) {
            return { status: 400, jsonBody: { error: "Bad Request: 'member' is required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        
        const systemInstruction = `You are a Senior Operations Manager providing a quick, insightful context summary about a team member for leadership. Your response should be in Markdown format.
- Analyze the provided data: the team member's profile, their assigned tasks, and the clients they manage.
- Create a concise overview covering these key areas:
  1.  **Role & Performance:** Briefly state their role and current performance score.
  2.  **Workload:** Summarize their current task load (e.g., total open, overdue). Mention any high-priority tasks.
  3.  **Client Portfolio:** Mention the number of clients they manage and highlight any that are 'At-Risk' or 'Critical'.
  4.  **Overall Summary:** Provide a 1-2 sentence concluding thought on their current status (e.g., "is managing a challenging portfolio effectively," "may need support with their overdue tasks," "is a stable performer with a healthy client list.").
- Use headings and bullet points for clarity.`;

        const userPrompt = `TEAM_MEMBER_DATA: ${JSON.stringify({ member, tasks, clients })}\n\nGenerate the context summary.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction,
            }
        });

        return {
            status: 200,
            jsonBody: { summary: response.text },
        };

    } catch (error) {
        context.error('Error in generateTeamMemberContext function:', error);
        return {
            status: 500,
            jsonBody: { error: 'An internal error occurred.', details: (error as Error).message },
        };
    }
};

export default httpTrigger;
