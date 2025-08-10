

import { InvocationContext, HttpRequest, HttpResponseInit } from "@azure/functions";
import { GoogleGenAI, Type } from "@google/genai";

const httpTrigger = async function (context: InvocationContext, req: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { session, teamMemberName, leaderName } = await req.json() as { session: any, teamMemberName: string, leaderName: string };

        if (!session || !teamMemberName || !leaderName) {
            return { status: 400, jsonBody: { error: "Bad Request: 'session', 'teamMemberName', and 'leaderName' are required." } };
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { status: 500, jsonBody: { error: "API key not configured." } };
        }

        const ai = new GoogleGenAI({ apiKey });
        
        const systemInstruction = `You are a professional Senior Manager drafting a follow-up email to a team member after a coaching session. Your response must be a valid JSON object with two keys: "subject" and "body".
- The subject should be concise and professional, like "Following up on our coaching session".
- The body should be a friendly, professional email. It should:
  1. Thank the team member for their time and the productive discussion.
  2. Briefly recap the main points from the session summary.
  3. Clearly list the action items for both sides (leader and employee) using bullet points.
  4. End with an encouraging and positive closing statement.
- The entire response must be a single, valid, raw JSON object. Do not include any text before or after the JSON object. Do not use markdown formatting.`;

        const userPrompt = `TEAM_MEMBER_NAME: "${teamMemberName}"\nLEADER_NAME: "${leaderName}"\nCOACHING_SESSION_DATA: ${JSON.stringify(session)}\n\nDraft the email and return it as a JSON object.`;
        
        const schema = {
            type: Type.OBJECT,
            properties: {
                subject: { type: Type.STRING },
                body: { type: Type.STRING }
            },
            required: ['subject', 'body']
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

        const draft = JSON.parse(response.text);

        return { status: 200, jsonBody: draft };

    } catch (error) {
        context.error('Error in draftCoachingFollowUpEmail function:', error);
        return { status: 500, jsonBody: { error: 'An internal error occurred.', details: (error as Error).message } };
    }
};

export default httpTrigger;
